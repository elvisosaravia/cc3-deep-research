"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, Clock } from "lucide-react";

interface ResearchReportProps {
  content: string;
  readingMode?: boolean;
}

export function ResearchReport({ content, readingMode }: ResearchReportProps) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  const wordCount = content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 250));

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "research-report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>~{readTime} min read</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            {copied ? (
              <Check className="mr-1 h-3 w-3" />
            ) : (
              <Copy className="mr-1 h-3 w-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadMarkdown}>
            <Download className="mr-1 h-3 w-3" />
            Download
          </Button>
        </div>
      </div>

      <article className={`prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-4 prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:my-0.5 ${readingMode ? "prose-lg py-4" : ""}`}>
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
