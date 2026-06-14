import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#fffaf3] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <span className="font-bold text-[#f97316] text-xl tracking-tight">CalorieSnap</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-[#1f1f1f] hover:text-[#f97316] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium bg-[#f97316] text-white rounded-xl hover:bg-[#ea580c] transition-colors shadow-sm"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-2xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-[#fff7ed] border border-[#fed7aa] rounded-full px-4 py-1.5 text-sm text-[#ea580c] font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse inline-block" />
          AI-powered calorie tracking
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-[#1f1f1f] leading-tight mb-4">
          Track meals from a photo.{" "}
          <span className="text-[#f97316]">Stay honest</span> with your calories.
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-md">
          Snap a photo of any meal. Our AI estimates calories and macros instantly — then you review before saving.
        </p>

        <Link
          href="/signup"
          className="px-8 py-3.5 bg-[#f97316] text-white font-semibold rounded-2xl hover:bg-[#ea580c] transition-all duration-150 shadow-md hover:shadow-lg text-base"
        >
          Start tracking — it&apos;s free
        </Link>

        <p className="mt-4 text-xs text-gray-400">
          No credit card needed · Works on mobile
        </p>
      </div>

      {/* Feature cards */}
      <div className="max-w-4xl mx-auto w-full px-6 pb-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            emoji: "📸",
            title: "Snap a photo",
            desc: "Point your camera at any dish — AI does the rest.",
          },
          {
            emoji: "✏️",
            title: "Review & edit",
            desc: "Always review and adjust AI estimates before saving.",
          },
          {
            emoji: "📊",
            title: "See your trends",
            desc: "Daily, weekly, and monthly calorie overviews with insights.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-2xl border border-[#fed7aa]/60 p-5 shadow-sm text-left"
          >
            <div className="text-2xl mb-3">{f.emoji}</div>
            <h3 className="font-semibold text-[#1f1f1f] mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      <footer className="text-center py-6 text-xs text-gray-400 border-t border-[#fed7aa]/40">
        CalorieSnap · AI estimates are not medical advice
      </footer>
    </main>
  );
}
