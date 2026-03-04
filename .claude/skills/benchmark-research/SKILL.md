---
name: benchmark-research
description: Benchmark the deep-research skill against the Next.js app. Runs randomized queries through both systems, compares outputs on 5 axes, and generates a scored assessment report with logs.
argument-hint: "[optional: number of queries, default 10]"
allowed-tools: Bash, Read, Write, WebSearch, WebFetch, Glob, Grep
---

# Benchmark Research Skill

You are a research benchmarking system. You will run randomized queries through **two research systems** — the baseline skill (Claude + WebSearch/WebFetch) and the Next.js app (Gemini 3 Flash + Exa) — then compare and score both outputs.

## Important Rules

- Run queries **sequentially**, one at a time.
- Write logs **incrementally** — each query's log is written immediately after scoring so results are preserved even if interrupted.
- Be rigorous and consistent in scoring. Use the rubric exactly.
- The argument (if provided) overrides the default query count of 10. Parse it as an integer.

---

## Step 0 — Setup

1. **Create logs directory** if it doesn't exist:
   ```bash
   mkdir -p logs
   ```

2. **Generate timestamp** for filenames using format `DD-MM-YYYY-HHmmss`:
   ```bash
   date +"%d-%m-%Y-%H%M%S"
   ```
   Store this timestamp string — all filenames will use it.

3. **Health check** — Verify the Next.js app is running at `localhost:3001`:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ --max-time 5
   ```
   If the response is not `200`, **abort immediately** with this message:
   > The Next.js app is not running. Start it with `npm run dev -- -p 3001` and re-run this benchmark.

4. **Determine query count** — Use the argument if provided (parse as integer), otherwise default to 10. Minimum 1, maximum 30.

5. **Select queries** — Randomly select the required number of queries from the pool below, ensuring **at least 1 from each of the 5 categories** (when running 5+ queries). Use a Python one-liner to randomize:
   ```bash
   python3 -c "
   import random, json
   pool = {
     'Science & Technology': [
       'Current state of quantum computing and its practical applications in 2025-2026',
       'How CRISPR gene editing is being used in clinical trials for genetic diseases',
       'The role of large language models in scientific discovery and research automation',
       'Advances in solid-state battery technology for electric vehicles',
       'Progress in nuclear fusion energy and timeline to commercial viability',
       'Impact of satellite mega-constellations like Starlink on astronomy and connectivity'
     ],
     'Economics & Business': [
       'Effects of AI automation on white-collar employment and job displacement',
       'The current state of global inflation and central bank monetary policies in 2026',
       'How the creator economy and platforms like YouTube/TikTok are reshaping media',
       'Impact of remote work on commercial real estate markets worldwide',
       'Rise of sovereign wealth funds and their influence on global tech investments',
       'State of the semiconductor supply chain and geopolitical implications'
     ],
     'Society & Culture': [
       'How social media algorithms affect political polarization and public discourse',
       'The global trend of declining birth rates and its societal consequences',
       'Current state of press freedom and journalism safety worldwide',
       'Impact of generative AI on the creative arts industry and copyright law',
       'How urbanization trends differ between developed and developing nations',
       'The evolution of privacy rights in the age of surveillance technology'
     ],
     'Environment & Climate': [
       'Effectiveness of carbon capture and storage technologies deployed so far',
       'Impact of microplastics on human health based on recent research',
       'Current state of global deforestation and reforestation efforts',
       'How climate change is affecting global food security and agriculture',
       'Progress on international climate agreements since the Paris Accord',
       'The role of ocean-based solutions in climate change mitigation'
     ],
     'Health & Medicine': [
       'Latest developments in mRNA vaccine technology beyond COVID-19',
       'Current understanding of long COVID and its treatment approaches',
       'How telemedicine adoption has changed healthcare delivery post-pandemic',
       'State of antibiotic resistance and new drug development pipelines',
       'Impact of ultra-processed foods on public health based on recent studies',
       'Advances in early cancer detection through liquid biopsy technology'
     ]
   }
   count = $COUNT
   categories = list(pool.keys())
   selected = []
   # Ensure at least 1 per category when count >= 5
   if count >= 5:
     for cat in categories:
       q = random.choice(pool[cat])
       selected.append({'category': cat, 'query': q})
       pool[cat].remove(q)
     remaining = count - 5
   else:
     remaining = count
   # Fill remaining slots randomly from all remaining queries
   all_remaining = []
   for cat, queries in pool.items():
     for q in queries:
       all_remaining.append({'category': cat, 'query': q})
   random.shuffle(all_remaining)
   selected += all_remaining[:remaining]
   random.shuffle(selected)
   print(json.dumps(selected))
   "
   ```
   Replace `$COUNT` with the determined query count. Parse the JSON output to get the list of `{category, query}` objects.

---

## Steps 1–N — For Each Query (Sequential)

For query number `NN` (01, 02, ... padded to 2 digits):

### Part A — Run the Next.js App

1. POST the query to the streaming API endpoint:
   ```bash
   curl -s -N -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"QUERY_TEXT"}]}]}' \
     --max-time 180 > /tmp/benchmark-app-NN.txt 2>&1
   ```
   Replace `QUERY_TEXT` with the actual query (properly JSON-escaped). Replace `NN` with the query number.

2. Parse the SSE stream to reconstruct the report text:
   ```bash
   python3 -c "
   import sys, json
   text = ''
   for line in open('/tmp/benchmark-app-NN.txt'):
       line = line.strip()
       if not line.startswith('data: '): continue
       data = line[6:]
       if data == '[DONE]': break
       try:
           obj = json.loads(data)
           if obj.get('type') == 'text-delta':
               text += obj.get('delta', '')
       except: pass
   print(text)
   "
   ```

3. If the curl command timed out or the parsed text is empty, record the result as `TIMEOUT` or `EMPTY` — assign score 0 on all axes for the app and continue to the next query.

### Part B — Run the Baseline Research (Inline)

Since the `Skill` tool is not available, execute a condensed version of the baseline methodology directly:

1. **Generate 3 search angles** for the query:
   - Core factual angle
   - Contrarian or alternative viewpoint angle
   - Recent data/statistics angle

2. **Execute 3 WebSearch calls** — one for each angle. Include the current year in queries for recency.

3. **From the search results, identify the top 3–4 most promising URLs.** Prioritize:
   - Primary sources and established publications
   - Recent content (2025–2026)
   - Diverse perspectives

4. **Fetch 3–4 URLs via WebFetch** with targeted extraction prompts (not generic summaries). For each URL, ask WebFetch to extract specific facts, data points, and expert quotes relevant to the query.

5. **Synthesize into a structured report** with this format:
   ```markdown
   # Research Report: [Topic]
   **Date:** [date] | **Sources consulted:** [number]

   ## Executive Summary
   [2-3 paragraphs summarizing key findings]

   ## Key Findings
   ### [Theme 1]
   [Findings with inline citations]
   ### [Theme 2]
   [Findings with inline citations]
   ### [Theme 3]
   [Findings with inline citations]

   ## Areas of Uncertainty
   [Disagreements, limitations, gaps]

   ## Sources
   1. [Title](URL)
   2. [Title](URL)
   ...
   ```

6. Keep the baseline report focused and concise — aim for 400-800 words. Don't over-research; the goal is a fair comparison within reasonable time.

### Part C — Score Both Outputs

Score each output (App and Baseline) on these 5 axes using a 1–5 scale:

| Score | Meaning |
|-------|---------|
| 1 | Poor — Major deficiencies, largely unusable |
| 2 | Below Average — Significant gaps, partially useful |
| 3 | Average — Acceptable quality, meets basic expectations |
| 4 | Good — Strong quality, minor issues only |
| 5 | Excellent — Outstanding, comprehensive, no notable issues |

**Axes:**

1. **Coherence** — Logical flow, no contradictions, well-connected arguments. Does the report read as a unified narrative or a disjointed collection of facts?

2. **Structure/Format** — Heading hierarchy, markdown quality, consistent formatting. Is the report well-organized and easy to navigate?

3. **Depth** — Specificity, multiple perspectives, concrete data points. Does the report go beyond surface-level coverage?

4. **Citations** — Source count, diversity, proper attribution, inline links. Are claims backed by traceable references?

5. **Style/Tone** — Professional, objective, engaging, appropriate register. Does the report read like quality journalism or research?

For each axis, provide:
- A numeric score (1–5) for the App output
- A numeric score (1–5) for the Baseline output
- A 1-sentence justification for each score

**Be fair and rigorous.** Don't inflate scores. A timeout/empty result gets 0 on all axes.

### Part D — Write Per-Query Log

Write the log file to `logs/<timestamp>-query-NN.md` with this structure:

```markdown
# Benchmark Query NN: [Query Text]
**Category:** [Category Name]
**Timestamp:** [timestamp]

---

## App Output (Gemini 3 Flash + Exa)

[Full app report text, or "TIMEOUT" / "EMPTY"]

---

## Baseline Output (Claude + WebSearch/WebFetch)

[Full baseline report text]

---

## Scoring

| Axis | App | Baseline | Notes |
|------|-----|----------|-------|
| Coherence | X | X | [justification] |
| Structure/Format | X | X | [justification] |
| Depth | X | X | [justification] |
| Citations | X | X | [justification] |
| Style/Tone | X | X | [justification] |
| **Total** | **XX** | **XX** | |

**Winner:** [App / Baseline / Tie]
```

---

## Step N+1 — Final Assessment

After all queries are complete, write the final assessment to `logs/<timestamp>-assessment.md`:

```markdown
# Benchmark Assessment Report
**Date:** [date]
**Queries Run:** [count]
**Timestamp:** [timestamp]

---

## Overall Results

| System | Wins | Losses | Ties | Avg Score |
|--------|------|--------|------|-----------|
| App (Gemini 3 Flash + Exa) | X | X | X | X.XX |
| Baseline (Claude + WebSearch/WebFetch) | X | X | X | X.XX |

## Per-Axis Averages

| Axis | App Avg | Baseline Avg | Delta |
|------|---------|--------------|-------|
| Coherence | X.XX | X.XX | +/-X.XX |
| Structure/Format | X.XX | X.XX | +/-X.XX |
| Depth | X.XX | X.XX | +/-X.XX |
| Citations | X.XX | X.XX | +/-X.XX |
| Style/Tone | X.XX | X.XX | +/-X.XX |

## Per-Query Summary

| # | Category | Query (short) | App | Baseline | Winner |
|---|----------|---------------|-----|----------|--------|
| 01 | [cat] | [first 50 chars...] | XX | XX | [W] |
| 02 | [cat] | [first 50 chars...] | XX | XX | [W] |
...

## Qualitative Analysis

### Strengths of the App (Gemini 3 Flash + Exa)
[2-3 bullet points based on observed patterns across all queries]

### Weaknesses of the App
[2-3 bullet points]

### Strengths of the Baseline (Claude + WebSearch/WebFetch)
[2-3 bullet points]

### Weaknesses of the Baseline
[2-3 bullet points]

## Category Performance

[Brief analysis of whether either system performed notably better or worse on specific categories]

## Recommendations

[3-5 actionable recommendations for improving each system based on the benchmark results]

## Log Files

[List of all per-query log files generated]
```

---

## Error Handling

- **App not running:** Abort immediately with instructions to start the dev server.
- **curl timeout (>180s):** Log as TIMEOUT, score 0 on all axes for the app, continue to next query.
- **Empty app response:** Log as EMPTY, score 0 on all axes for the app, continue to next query.
- **WebSearch failures:** Retry once. If still failing, note the failure and continue with available results.
- **WebFetch failures:** Retry once with a different URL from search results. If still failing, proceed with available content.
- **Partial completion:** All logs are written incrementally. If interrupted, previously written query logs are complete and usable.

---

## Output Summary

When finished, print a summary to the user:

```
Benchmark complete!
- Queries run: [count]
- App wins: [X] | Baseline wins: [X] | Ties: [X]
- App avg score: [X.XX] | Baseline avg score: [X.XX]
- Assessment: logs/<timestamp>-assessment.md
- Query logs: logs/<timestamp>-query-*.md
```
