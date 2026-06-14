process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Load environment variables from .env (DATABASE_URL, AUTH_SECRET, GEMINI_API_KEY, ...).
// Next also loads .env, but we do it up front so anything reading process.env early
// (e.g. the Prisma client) sees the values.
try {
  require("dotenv").config();
} catch (err) {
  console.warn("dotenv not available, relying on process env:", err?.message);
}

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    }).listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
