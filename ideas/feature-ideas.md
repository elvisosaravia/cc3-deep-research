# Deep Research App — Feature Ideas & Improvements

Generated 2026-03-02 after reviewing the full codebase and testing end-to-end.

---

## High Impact

### 1. Fix: Sources in report aren't clickable links
**Effort:** Small (prompt change)
**Files:** `src/app/api/chat/route.ts`

The Sources section at the bottom of reports renders as plain text (e.g., "Introducing GPT-4.5 - OpenAI") instead of hyperlinks. The AI has the URLs from Exa search results — the system prompt just needs to instruct the model to format sources as markdown links `[title](url)`. This was issue #3 from the original test log.

### 2. Copy / Export report button
**Effort:** Small
**Files:** `src/components/research-report.tsx`, `src/app/page.tsx`

After waiting 20-30 seconds for a report, users want to do something with it. Add a "Copy to clipboard" button (and optionally "Download as Markdown") at the top of the report. The raw markdown is already available in `reportContent` — just need a button that calls `navigator.clipboard.writeText()`.

### 3. Research history (recent searches)
**Effort:** Medium
**Files:** New component + `src/app/page.tsx`

Each research session is currently ephemeral. Store past queries + reports in `localStorage` and show a sidebar or dropdown of recent searches. Users could revisit old reports without re-running them. Structure: `{ id, query, report, sources, timestamp }[]`.

### 4. Follow-up questions / refine research
**Effort:** Medium-Large
**Files:** `src/app/page.tsx`, `src/app/api/chat/route.ts`

After a report, let the user ask a follow-up like "dig deeper into the cardiovascular risks" or "compare Toyota vs QuantumScape." Send a new message in the same chat context so the AI has prior research to build on, rather than starting from scratch. Would need a secondary input mode (e.g., a smaller input below the report) and logic to differentiate initial vs follow-up queries.

---

## Medium Impact

### 5. Progress indicator during research
**Effort:** Small
**Files:** `src/components/step-display.tsx`

No sense of how far along the process is during the 20-30 second wait. Add "Step 2 of ~5" or a progress bar. The system prompt asks for 3-5 queries, so progress can be estimated against that range. Could show in the collapsed bar or as a thin bar above the steps.

### 6. Dark mode toggle
**Effort:** Small
**Files:** `src/app/layout.tsx` or new `ThemeToggle` component

The CSS already has full dark mode theming defined in `globals.css` with OKLCH color variables — it's completely wired up but not toggleable. A single button in the header that toggles `.dark` on the `<html>` element (with `localStorage` persistence) would activate the entire theme. All shadcn components and prose styling already support it.

### 7. Fix: Inline citations aren't clickable
**Effort:** Small (prompt change)
**Files:** `src/app/api/chat/route.ts`

In Key Findings, citations like "The Verge, Fast Company" render as bold text, not links. The system prompt says "inline source citations" but doesn't specify markdown link syntax. Update the prompt to say: "For all citations, use markdown link syntax linking to the source URL, e.g., [The Verge](https://theverge.com/article)."

### 8. "New Research" reset button
**Effort:** Small
**Files:** `src/app/page.tsx`

After viewing a report, the only way to start fresh is to type a new query. Add a "New Research" or "Clear" button near the search bar that resets to the clean idle state: `setMessages([])`, `setTopic("")`. Useful when users want to return to the landing view.

### 9. Estimated read time on the report
**Effort:** Small
**Files:** `src/components/research-report.tsx`

Reports are substantial (1000+ words). Show "~4 min read" at the top of the report. Calculation: `Math.ceil(wordCount / 250)` minutes. Gives users expectations and adds a polished touch.

---

## Lower Impact / Polish

### 10. Animate step collapse/expand transition
**Effort:** Small-Medium
**Files:** `src/components/step-display.tsx`

When the report starts rendering, steps snap from expanded to collapsed instantly. A smooth height animation (CSS `max-height` transition, `grid-template-rows: 0fr/1fr` trick, or Framer Motion `AnimatePresence`) would feel more polished.

### 11. Table of contents for the report
**Effort:** Medium
**Files:** `src/components/research-report.tsx`

For longer reports, add a sticky mini-TOC parsed from h2/h3 headings in the markdown. Could be a floating pill on the side or a small nav at the top of the report. Use `react-markdown`'s AST to extract headings and generate anchor links.

### 12. Shareable report URLs
**Effort:** Medium-Large
**Files:** New API route, new dynamic page route

Generate a unique URL for each report (hash-based or stored in a lightweight DB/KV). Users could share `app.com/report/abc123` with colleagues. Would need server-side storage (could start with file-based or use Vercel KV).

### 13. Skeleton loading for the report gap
**Effort:** Small
**Files:** `src/app/page.tsx`

When searches finish but the report hasn't started streaming yet, there's a brief blank gap. Add a skeleton loader shaped like a report (title line + paragraph blocks) to bridge that moment. The `Skeleton` component already exists.

### 14. Source favicons / quality indicators
**Effort:** Small-Medium
**Files:** `src/components/step-display.tsx`

Show small domain favicons next to each source in the step cards (use `https://www.google.com/s2/favicons?domain=example.com`). Gives users an instant visual sense of source quality (Nature logo vs unknown blog).

### 15. Mobile: sticky search bar
**Effort:** Small
**Files:** `src/app/page.tsx`

On mobile, the search input scrolls away once you're in the report. Make it sticky at the top on small screens (`sticky top-0 z-10` with a background) so users can start a new search anytime without scrolling back up.
