"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { SearchInput } from "@/components/search-input";
import { StepDisplay } from "@/components/step-display";
import { ResearchReport } from "@/components/research-report";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RotateCcw, Moon, Sun } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState("");
  const [searchKey, setSearchKey] = useState(0);
  const [readingMode, setReadingMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { messages, setMessages, sendMessage, status, error } = useChat();

  // Initialize dark mode from localStorage
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

  // Collect all tool invocations and final text from assistant messages
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

  // Progress: count completed steps vs estimated total (3-5 queries)
  const completedSteps = toolSteps.filter(
    (s) => s.results && s.results.length > 0
  ).length;
  const inProgressSteps = toolSteps.filter(
    (s) => !s.results || s.results.length === 0
  ).length;
  const totalEstimate = Math.max(completedSteps + inProgressSteps, 3);

  return (
    <div className="flex min-h-screen flex-col items-center px-4">
      {/* Dark mode toggle — top right */}
      <div className="fixed right-4 top-4 z-20">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {!readingMode && (
        <div
          className={`flex w-full flex-col items-center transition-all duration-500 ${
            isIdle ? "mt-[30vh]" : "mt-8"
          }`}
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Deep Research
            </h1>
            {isIdle && (
              <p className="mt-2 text-muted-foreground">
                Enter a topic and let AI research it for you
              </p>
            )}
          </div>

          <div className="flex w-full max-w-2xl items-center gap-2">
            <div className="flex-1">
              <SearchInput
                value={input}
                onChange={setInput}
                onSubmit={onSubmit}
                isLoading={isLoading}
              />
            </div>
            {!isIdle && !isLoading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                title="New Research"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className={`mt-8 flex w-full flex-col items-center gap-4 pb-16 transition-all duration-300 ${readingMode ? "max-w-4xl" : "max-w-2xl"}`}>
        {!readingMode && topic && !isIdle && (
          <h2 className="w-full max-w-2xl text-lg font-medium text-muted-foreground">
            Researching: <span className="text-foreground">{topic}</span>
          </h2>
        )}

        {/* Progress indicator */}
        {!readingMode && isLoading && toolSteps.length > 0 && !hasReport && (
          <div className="w-full max-w-2xl">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {completedSteps + (inProgressSteps > 0 ? 1 : 0)} of ~{totalEstimate}</span>
              <span>{completedSteps} completed</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min((completedSteps / totalEstimate) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="w-full max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 opacity-80">{error.message}</p>
          </div>
        )}

        {!readingMode && isLoading && toolSteps.length === 0 && !error && (
          <div className="w-full max-w-2xl space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        )}

        {!readingMode && toolSteps.length > 0 && (
          <StepDisplay key={searchKey} steps={toolSteps} hasReport={hasReport} />
        )}

        {hasReport && (
          <>
            <div className="flex w-full justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReadingMode(!readingMode)}
              >
                {readingMode ? "Exit reading mode" : "Reading mode"}
              </Button>
            </div>
            <div id="report" className="w-full">
              <ResearchReport content={reportContent} readingMode={readingMode} />
            </div>
          </>
        )}

        {isLoading && hasReport && (
          <div className="w-full max-w-2xl">
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
      </div>
    </div>
  );
}
