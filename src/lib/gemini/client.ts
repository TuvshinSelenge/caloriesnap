import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

type GeminiErrorCode =
  | "missing_api_key"
  | "auth"
  | "quota"
  | "model"
  | "invalid_response"
  | "timeout"
  | "transient"
  | "unknown";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_TIMEOUT_MS = 25_000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_RETRY_BASE_MS = 500;
const DEFAULT_MAX_RETRY_DELAY_MS = 2_500;

let geminiClient: GoogleGenAI | null = null;
let geminiClientApiKey: string | null = null;

export class GeminiRequestError extends Error {
  readonly code: GeminiErrorCode;
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    options: {
      code: GeminiErrorCode;
      status?: number;
      retryAfterMs?: number;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "GeminiRequestError";
    this.code = options.code;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
    this.cause = options.cause;
  }
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiRequestError("GEMINI_API_KEY is required.", {
      code: "missing_api_key",
      status: 503,
    });
  }

  if (!geminiClient || geminiClientApiKey !== apiKey) {
    geminiClient = new GoogleGenAI({ apiKey });
    geminiClientApiKey = apiKey;
  }

  return geminiClient;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export async function runGeminiRequest<T>(operation: () => Promise<T>): Promise<T> {
  const timeoutMs = readPositiveInt("GEMINI_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  const maxRetries = readPositiveInt("GEMINI_MAX_RETRIES", DEFAULT_MAX_RETRIES);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs);
    } catch (err) {
      const error = normalizeGeminiError(err);
      if (!shouldRetry(error, attempt, maxRetries)) {
        throw error;
      }

      await sleep(getRetryDelayMs(error, attempt));
    }
  }

  throw new GeminiRequestError("AI request failed.", { code: "unknown" });
}

export function parseGeminiJson<T>(text: string | undefined, schema: z.ZodType<T>): T {
  const body = text?.trim() ?? "";
  if (!body) {
    throw new GeminiRequestError("AI returned an empty response.", {
      code: "invalid_response",
      status: 502,
    });
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch (err) {
    throw new GeminiRequestError("AI returned malformed JSON.", {
      code: "invalid_response",
      status: 502,
      cause: err,
    });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new GeminiRequestError("AI returned JSON that did not match the expected schema.", {
      code: "invalid_response",
      status: 502,
      cause: parsed.error,
    });
  }

  return parsed.data;
}

export function getGeminiHttpError(
  err: unknown,
  fallbackMessage: string
): { message: string; status: number } {
  const error = normalizeGeminiError(err);

  switch (error.code) {
    case "missing_api_key":
      return {
        message: "AI is not configured: GEMINI_API_KEY is missing on the server.",
        status: 503,
      };
    case "auth":
      return {
        message: "AI rejected the request - check that GEMINI_API_KEY is valid and billing is enabled.",
        status: 502,
      };
    case "quota": {
      const retry = error.retryAfterMs
        ? ` Please retry in about ${Math.ceil(error.retryAfterMs / 1000)} seconds.`
        : "";
      return {
        message: `AI quota or rate limit was reached.${retry}`,
        status: 429,
      };
    }
    case "model":
      return {
        message: `AI model error - check GEMINI_MODEL (${getGeminiModel()}).`,
        status: 502,
      };
    case "invalid_response":
      return {
        message: "AI returned an unexpected response. Please try again.",
        status: 502,
      };
    case "timeout":
      return {
        message: "AI analysis took too long. Please try again with a smaller image or shorter description.",
        status: 504,
      };
    default:
      return { message: fallbackMessage, status: 500 };
  }
}

function normalizeGeminiError(err: unknown): GeminiRequestError {
  if (err instanceof GeminiRequestError) return err;

  const message = getErrorMessage(err);
  const status = getStatus(message);
  const retryAfterMs = getRetryAfterMs(message);

  if (/quota|RESOURCE_EXHAUSTED|rate.?limit|too many requests|429/i.test(message)) {
    return new GeminiRequestError(message, {
      code: "quota",
      status: 429,
      retryAfterMs,
      cause: err,
    });
  }

  if (/api key|API_KEY_INVALID|permission|401|403/i.test(message)) {
    return new GeminiRequestError(message, { code: "auth", status: status ?? 502, cause: err });
  }

  if (/not found|404|model/i.test(message)) {
    return new GeminiRequestError(message, { code: "model", status: status ?? 502, cause: err });
  }

  if (/timeout|timed out/i.test(message)) {
    return new GeminiRequestError(message, { code: "timeout", status: 504, cause: err });
  }

  if (/UNAVAILABLE|DEADLINE_EXCEEDED|INTERNAL|overloaded|temporarily|500|502|503|504/i.test(message)) {
    return new GeminiRequestError(message, {
      code: "transient",
      status: status ?? 502,
      retryAfterMs,
      cause: err,
    });
  }

  return new GeminiRequestError(message, {
    code: "unknown",
    status,
    retryAfterMs,
    cause: err,
  });
}

function shouldRetry(error: GeminiRequestError, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  if (error.code === "transient") return true;

  const maxRetryDelayMs = readPositiveInt("GEMINI_MAX_RETRY_DELAY_MS", DEFAULT_MAX_RETRY_DELAY_MS);
  return error.code === "quota" && !!error.retryAfterMs && error.retryAfterMs <= maxRetryDelayMs;
}

function getRetryDelayMs(error: GeminiRequestError, attempt: number): number {
  if (error.retryAfterMs) return error.retryAfterMs;

  const baseMs = readPositiveInt("GEMINI_RETRY_BASE_MS", DEFAULT_RETRY_BASE_MS);
  return baseMs * 2 ** attempt;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(
        new GeminiRequestError(`AI request timed out after ${timeoutMs}ms.`, {
          code: "timeout",
          status: 504,
        })
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;

  if (typeof err === "string") return err;

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function getStatus(message: string): number | undefined {
  const match = message.match(/\b(4\d\d|5\d\d)\b/);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

function getRetryAfterMs(message: string): number | undefined {
  const match =
    message.match(/retryDelay["']?\s*:?\s*["']?(\d+(?:\.\d+)?)s/i) ??
    message.match(/retry in\s+(\d+(?:\.\d+)?)s/i);

  if (!match) return undefined;
  return Math.ceil(Number.parseFloat(match[1]) * 1000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
