"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { SearchInput } from "@/components/search-input";
import { StepDisplay } from "@/components/step-display";
import { ResearchReport } from "@/components/research-report";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RotateCcw, Moon, Sun, FlaskConical } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const [readingMode, setReadingMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { messages, setMessages, sendMessage, status, error } = useChat();

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    const isDark = stored === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("darkMode", String(next));
  };

  const isLoading = status === "streaming" || status === "submitted";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setTopic(text);
    setInput("");
    setMessages([]);
    setReadingMode(false);
    setSearchKey((k) => k + 1);
    await sendMessage({ text });
  };

  const onReset = () => {
    setTopic("");
    setMessages([]);
    setReadingMode(false);
    setSearchKey((k) => k + 1);
  };

  interface ToolStep {
    state: string;
    query?: string;
    results?: Array<{ title: string; url: string; text: string }>;
  }
  const toolSteps: ToolStep[] = [];
  let reportContent = "";

  for (const message of messages) {
    if (message.role === "assistant" && message.parts) {
      for (const part of message.parts) {
        if (part.type.startsWith("tool-")) {
          const p = part as Record<string, unknown>;
          const toolInput = p.input as { query?: string } | undefined;
          const toolOutput = p.output as {
            query: string;
            results: Array<{ title: string; url: string; text: string }>;
          } | undefined;
          toolSteps.push({
            state: p.state as string,
            query: toolInput?.query,
            results: toolOutput?.results,
          });
        } else if (part.type === "text") {
          const textPart = part as { type: "text"; text: string };
          if (textPart.text) {
            reportContent = textPart.text;
          }
        }
      }
    }
  }

  const isIdle = messages.length === 0 && !error;
  const hasReport = reportContent.length > 0;

  const completedSteps = toolSteps.filter(
    (s) => s.results && s.results.length > 0
  ).length;
  const inProgressSteps = toolSteps.filter(
    (s) => !s.results || s.results.length === 0
  ).length;
  const totalEstimate = Math.max(completedSteps + inProgressSteps, 3);

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Top nav bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FlaskConical className="h-4 w-4 text-primary" />
          </div>
          <span className="font-serif text-lg tracking-tight text-foreground">
            Deep Research
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isIdle && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              New
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-muted-foreground hover:text-foreground"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-6">
        {/* Hero / Search area */}
        {!readingMode && (
          <div
            className={`flex w-full max-w-2xl flex-col items-center transition-all duration-700 ease-out ${
              isIdle ? "mt-[28vh]" : "mt-10"
            }`}
          >
            {isIdle && (
              <div className="mb-10 text-center">
                <h1 className="font-serif text-5xl tracking-tight text-foreground">
                  Deep Research
                </h1>
                <p className="mt-3 text-base text-muted-foreground">
                  AI-powered research across the web, synthesized into a
                  structured report.
                </p>
              </div>
            )}

            <SearchInput
              value={input}
              onChange={setInput}
              onSubmit={onSubmit}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Content area */}
        <div
          className={`mt-8 flex w-full flex-col items-center gap-5 pb-20 transition-all duration-500 ${
            readingMode ? "max-w-3xl" : "max-w-2xl"
          }`}
        >
          {/* Topic label */}
          {!readingMode && topic && !isIdle && (
            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {isLoading ? "Researching" : "Research complete"}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {!readingMode && topic && !isIdle && (
            <h2 className="w-full font-serif text-2xl tracking-tight text-foreground">
              {topic}
            </h2>
          )}

          {/* Progress indicator */}
          {!readingMode && isLoading && toolSteps.length > 0 && !hasReport && (
            <div className="w-full">
              <div className="mb-2 flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>
                  Step {completedSteps + (inProgressSteps > 0 ? 1 : 0)} of ~
                  {totalEstimate}
                </span>
                <span>{completedSteps} completed</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(
                      (completedSteps / totalEstimate) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">
                Something went wrong
              </p>
              <p className="mt-1 text-destructive/70">{error.message}</p>
            </div>
          )}

          {!readingMode && isLoading && toolSteps.length === 0 && !error && (
            <div className="w-full space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          )}

          {!readingMode && toolSteps.length > 0 && (
            <StepDisplay
              key={searchKey}
              steps={toolSteps}
              hasReport={hasReport}
            />
          )}

          {hasReport && (
            <>
              <div className="flex w-full items-center justify-between">
                <div className="h-px flex-1 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReadingMode(!readingMode)}
                  className="mx-3 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {readingMode ? "Exit reading mode" : "Reading mode"}
                </Button>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div id="report" className="w-full">
                <ResearchReport
                  content={reportContent}
                  readingMode={readingMode}
                />
              </div>
            </>
          )}

          {isLoading && hasReport && (
            <div className="w-full">
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
