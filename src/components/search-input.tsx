"use client";

import { Search, Loader2, ArrowRight } from "lucide-react";
import { FormEvent } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: SearchInputProps) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="group relative flex items-center rounded-xl border border-border bg-card shadow-sm transition-all duration-300 focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/5 hover:border-border/80 hover:shadow-md hover:shadow-primary/5">
        <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-focus-within:text-primary/60" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What would you like to research?"
          className="h-14 flex-1 bg-transparent px-3 text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus-visible:!outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="mr-2 flex h-10 items-center gap-2 rounded-lg bg-primary px-5 font-mono text-xs font-medium uppercase tracking-wider text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-30 focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Researching</span>
            </>
          ) : (
            <>
              <span>Research</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
