import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { GithubIcon, YoutubeIcon, MediumIcon, AdplistIcon } from "@/components/Icons";

export default function HomePage() {
  const posts = getAllPosts();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const socialLinks = [
    { icon: <GithubIcon className="w-5 h-5" />, href: "https://github.com/tlulu", label: "GitHub" },
    { icon: <YoutubeIcon className="w-5 h-5" />, href: "https://youtube.com/@tonylu22", label: "YouTube" },
    { icon: <MediumIcon className="w-5 h-5" />, href: "https://tlulu.medium.com", label: "Medium" },
    { icon: <AdplistIcon className="w-5 h-5" />, href: "https://adplist.org/mentors/tony-lu", label: "ADPList" },
  ];

  return (
    <main className="max-w-md mx-auto w-full px-6 py-12 sm:px-8 md:py-16">
      <div className="space-y-10 animate-fadeIn duration-500">
        {/* Profile Header */}
        <div className="flex items-center justify-center gap-6">
          <img
            src="/images/profile.jpeg"
            alt="Tony Lu"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border border-[var(--border)] shadow-sm shrink-0"
          />
          <div className="flex flex-col gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              Tony Lu
            </h1>
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="hover:scale-110 hover:opacity-80 transition-all duration-200"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <section className="text-[15px] leading-relaxed text-[var(--foreground)] opacity-90 space-y-2">
          <p>Hi there!</p>
          <p>
            This is a space where I talk about my{" "}
            <Link
              href="/work"
              className="text-[var(--accent)] font-bold hover:opacity-85 transition-opacity"
            >
              work
            </Link>
            ,
          </p>
          <p>
            what makes me feel {" "}
            <Link
              href="/fun"
              className="text-[var(--accent)] font-bold hover:opacity-85 transition-opacity"
            >
              alive
            </Link>
            ,
          </p>
          <p>
            and my musings:
          </p>
        </section>

        {/* Posts Section */}
        <section className="space-y-6 !mt-6">
          <div className="border-t border-[var(--border)] mb-6" />
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.slug} className="flex flex-col gap-1">
                <h3 className="text-[15px] font-medium text-[var(--foreground)]">
                  <Link href={`/writing/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h3>
                <time className="text-sm text-[var(--muted)]">
                  {formatDate(post.date)}
                </time>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
