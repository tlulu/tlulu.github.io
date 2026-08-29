"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { YouTubeEmbed } from "@next/third-parties/google";
import getYouTubeID from "get-youtube-id";

interface MarkdownRendererProps {
  content: string;
}

function preserveMultipleNewlines(raw: string): string {
  // If the user typed 3 or more consecutive newlines (i.e. 2 or more empty lines),
  // insert an explicit height spacer so multiple enters create a guaranteed, visible gap.
  return raw.replace(/\n{3,}/g, (match) => {
    const extraEmptyLines = match.length - 2;
    return (
      "\n\n" +
      '<span style="display: block; height: 16px;" aria-hidden="true"></span>\n\n'.repeat(
        extraEmptyLines
      )
    );
  });
}

function getGiphyId(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    if (url.hostname === "giphy.com" || url.hostname === "www.giphy.com") {
      if (url.pathname.startsWith("/gifs/")) {
        const parts = url.pathname.split("/").filter(Boolean);
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
          const dashParts = lastPart.split("-");
          return dashParts[dashParts.length - 1] || null;
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

function isUrlLinkText(children: React.ReactNode, href?: string): boolean {
  if (!href) return false;
  if (typeof children === "string") {
    const text = children.trim();
    return text === href.trim() || text.includes("youtube.com") || text.includes("youtu.be") || text.includes("giphy.com");
  }
  if (Array.isArray(children)) {
    const text = children
      .map((c) => (typeof c === "string" ? c : ""))
      .join("")
      .trim();
    return text === href.trim() || text.includes("youtube.com") || text.includes("youtu.be") || text.includes("giphy.com");
  }
  return false;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const processedContent = preserveMultipleNewlines(content);

  return (
    <div className="prose max-w-none prose-p:my-6 prose-p:leading-relaxed prose-a:text-[var(--accent)] prose-a:underline hover:prose-a:opacity-85 prose-img:rounded-xl prose-img:border prose-img:border-[var(--border)] prose-img:shadow-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[var(--card)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:text-[var(--foreground)] prose-pre:rounded-xl prose-pre:p-4 prose-pre:shadow-sm prose-pre:prose-code:bg-transparent prose-pre:prose-code:text-inherit prose-pre:prose-code:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
        components={{
          code: ({ className, children, ...props }) => {
            const isCodeBlock = Boolean(className) || String(children).includes("\n");
            if (!isCodeBlock) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-[rgba(135,131,120,0.15)] text-[#eb5757] font-mono text-[0.875em] font-medium before:content-none after:content-none"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: ({ href, children, ...props }) => {
            const videoId = href ? getYouTubeID(href, { fuzzy: true }) : null;
            if (videoId && isUrlLinkText(children, href)) {
              return (
                <span className="block my-6 w-full not-prose rounded-xl overflow-hidden shadow-sm border border-[var(--border)] [&_lite-youtube]:max-w-none [&_lite-youtube]:w-full">
                  <YouTubeEmbed
                    videoid={videoId}
                    params="rel=0"
                    style="max-width: 100%; width: 100%;"
                  />
                </span>
              );
            }

            const giphyId = href ? getGiphyId(href) : null;
            if (giphyId && isUrlLinkText(children, href)) {
              return (
                <img
                  src={`https://media.giphy.com/media/${giphyId}/giphy.gif`}
                  alt="GIF"
                  className="my-6 rounded-xl border border-[var(--border)] shadow-sm max-w-full"
                  loading="lazy"
                />
              );
            }

            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          br: () => (
            <span className="block mt-[4px]" aria-hidden="true" />
          ),
          p: ({ node, children, ...props }) => {
            const hasBlockEmbed = (node?.children || []).some((child: any) => {
              if (child.type === "element") {
                if (child.tagName === "a") {
                  const href = child.properties?.href;
                  if (
                    typeof href === "string" &&
                    (Boolean(getYouTubeID(href, { fuzzy: true })) || Boolean(getGiphyId(href)))
                  ) {
                    return true;
                  }
                }
                if (
                  child.tagName === "span" &&
                  typeof child.properties?.style === "string" &&
                  child.properties.style.includes("height")
                ) {
                  return true;
                }
              }
              return false;
            });

            if (hasBlockEmbed) {
              const nonWhitespaceChildren = (node?.children || []).filter((child: any) => {
                if (child.type === "text") {
                  return child.value.trim().length > 0;
                }
                return true;
              });

              if (nonWhitespaceChildren.length === 1) {
                return <>{children}</>;
              }

              return (
                <div className="my-1 leading-relaxed" {...props}>
                  {children}
                </div>
              );
            }

            return <p {...props}>{children}</p>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
