import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function FunPage() {
  return (
    <div className="space-y-8 animate-fadeIn duration-500 w-full">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-xl border border-dashed border-[var(--border)] p-8">
        <span className="text-3xl">🚧</span>
        <h2 className="text-lg font-medium text-[var(--foreground)]">
          Under Construction
        </h2>
        <p className="text-sm text-[var(--muted)] max-w-sm">
          Learning some WebGL for this page.
        </p>
      </div>
    </div>
  );
}
