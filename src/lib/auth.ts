import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

function toNameEmail(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return `name-${slug || "user"}@calories.local`;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Required on non-Vercel hosts (e.g. Hostinger) so Auth.js v5 trusts the
  // incoming Host header instead of throwing UntrustedHost on every request.
  trustHost: true,
  // Prefer the env secret; fall back to a constant so the app never hard-crashes
  // at startup if the runtime env var is missing. Set AUTH_SECRET in hPanel for
  // real security — this fallback only prevents a 503 during initial setup.
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "caloriesnap-fallback-secret-please-set-AUTH_SECRET-in-env",
  providers: [
    Credentials({
      credentials: {
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const name = parsed.data.name.trim();
        let user = null as Awaited<ReturnType<typeof prisma.user.findUnique>>;

        // Allow typing an existing email as a "name" for backwards compatibility.
        if (name.includes("@")) {
          user = await prisma.user.findUnique({ where: { email: name.toLowerCase() } });
        }

        if (!user) {
          // If user already completed onboarding, let them log in with display name.
          const profile = await prisma.profile.findFirst({
            where: { displayName: name },
            select: { userId: true },
          });
          if (profile) {
            user = await prisma.user.findUnique({ where: { id: profile.userId } });
          }
        }

        if (!user) {
          // First login with a new name creates an account automatically.
          const email = toNameEmail(name);
          user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
              email,
              passwordHash: "name-login-no-password",
            },
          });
        }

        return { id: user.id, email: user.email, name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
