import Link from "next/link";
import { getAllProjects } from "@/lib/projects";
import { ArrowLeft } from "lucide-react";

export default function EngineeringPage() {
  const projects = getAllProjects();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    // If it's already a year range or year (e.g., "2015-2017", "2015 - 2017", "2020"), return as is
    if (/^\d{4}(\s*[-–—]\s*(\d{4}|Present))?$/i.test(dateStr.trim())) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="max-w-lg mx-auto w-full px-6 py-12 sm:px-8 md:py-16">
      <div className="space-y-6 animate-fadeIn duration-500">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
        <section className="text-[15px] leading-relaxed text-[var(--foreground)] opacity-90">
          <p>I'm beyond proud of leaving my imprints on the world through these works.</p>
        </section>

        <section className="!mt-6">
          <div className="border-t border-[var(--border)] mb-6" />
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {projects.map((project) => (
              <Link
                key={project.slug}
                href={`/work/${project.slug}`}
                className="group flex flex-col p-2.5 sm:p-3 rounded-2xl bg-[var(--background)] hover:bg-[var(--card)]/60 hover:border-[var(--accent)] transition-all duration-200 h-full"
              >
                <div className="w-full aspect-square rounded-2xl bg-white border border-[var(--border)] p-4 sm:p-5 flex items-center justify-center mb-3 shadow-xs group-hover:scale-[1.02] transition-transform shrink-0 overflow-hidden">
                  <img
                    src={project.icon}
                    alt={project.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-[14px] sm:text-[15px] font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug px-1 line-clamp-2">
                  {project.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
