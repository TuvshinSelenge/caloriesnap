"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      // Auto sign in after signup
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
        router.push("/login");
        return;
      }

      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-[#f97316] text-2xl tracking-tight">
            CalorieSnap
          </Link>
          <h1 className="text-xl font-semibold text-[#1f1f1f] mt-4 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500">Start tracking calories with AI</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#fed7aa]/60 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="new-password"
              hint="At least 8 characters"
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#f97316] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
