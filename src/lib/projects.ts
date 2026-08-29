import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface ProjectMeta {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  summary: string;
  icon?: string;
}

export interface ProjectData extends ProjectMeta {
  content: string;
}

const CONTENT_DIR = fs.existsSync(path.join(process.cwd(), "content", "work"))
  ? path.join(process.cwd(), "content", "work")
  : path.join(process.cwd(), "content", "engineering");

const defaultIcons: Record<string, string> = {
  bitcoin_lightning: "/images/icons/lightning_logo.jpg",
  bitcoin_custody: "/images/icons/block_logo.jpg",
  investing: "/images/icons/investing.jpg",
  connextor: "/images/icons/connextor_logo.png",
};

export function getAllProjects(): ProjectMeta[] {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  const projects = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
    const { data } = matter(raw);

    return {
      slug,
      title: data.title as string,
      subtitle: data.subtitle as string,
      date: data.date as string,
      summary: data.summary as string,
      icon: (data.icon as string) || defaultIcons[slug] || "/images/icons/cash_app_logo.png",
    };
  });

  // Sort by date descending (newest first)
  return projects.sort((a, b) => {
    const parseDate = (d: string) => {
      if (!d) return 0;
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed.getTime();
      const match = d.match(/\d{4}/);
      if (match) return new Date(match[0]).getTime();
      return 0;
    };
    return parseDate(b.date) - parseDate(a.date);
  });
}

export function getProjectBySlug(slug: string): ProjectData | null {
  const filepath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filepath)) return null;

  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title as string,
    subtitle: data.subtitle as string,
    date: data.date as string,
    summary: data.summary as string,
    icon: (data.icon as string) || defaultIcons[slug] || "/images/icons/cash_app_logo.png",
    content,
  };
}

export function getAllProjectSlugs(): string[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
