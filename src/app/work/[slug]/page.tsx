import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getAllProjectSlugs } from "@/lib/projects";
import { ArrowLeft } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
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
    <article className="space-y-6 animate-fadeIn duration-500 w-full">
      <div className="mb-8">
        <Link
          href="/work"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to work
        </Link>
        <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            {project.title}
          </h1>
          <time className="text-sm text-[var(--muted)]">
            {formatDate(project.date)}
          </time>
        </div>
      </div>

      <MarkdownRenderer content={project.content} />
    </article>
  );
}
