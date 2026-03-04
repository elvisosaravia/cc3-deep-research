# Subagents vs Agent Teams in Claude Code

## Comparison Table

| | **Subagents** | **Agent Teams** |
|---|---|---|
| **What it is** | Helper agents spawned *within* your session | Multiple independent Claude Code instances coordinating together |
| **Context** | Own context window; results return to caller | Own context window; fully independent |
| **Communication** | One-way: reports results back to main agent only | Two-way: teammates message each other directly |
| **Coordination** | Main agent manages all work | Shared task list with self-coordination |
| **Spawning** | Automatic (Claude decides) or explicit | You request it, or Claude proposes it |
| **Nesting** | Cannot spawn other subagents | Cannot spawn nested teams |
| **Token cost** | Lower — results summarized back | Higher — each teammate is a separate instance |
| **Status** | Stable, built-in | Experimental, opt-in via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` |
| **Best for** | Focused tasks where only the result matters (exploration, tests, reviews) | Complex work requiring discussion, debate, and collaboration |
| **Display** | Runs inside your session | In-process (Shift+Down to cycle) or split panes (tmux/iTerm2) |
| **Configuration** | Markdown files with YAML frontmatter in `.claude/agents/` or `~/.claude/agents/` | Natural language — you describe the team structure |
| **Built-in types** | Explore (haiku, read-only), Plan (read-only), General-purpose (all tools) | None — you define roles per task |
| **Model control** | Per-subagent (`model: haiku`, `sonnet`, `opus`, `inherit`) | Per-teammate at spawn time |
| **Persistence** | Transcripts persist; can be resumed by agent ID | No session resumption for in-process teammates |

## When to use which

**Use subagents when:**
- Task produces verbose output you don't need in main context
- Work is self-contained and can return a summary
- You want to enforce specific tool restrictions
- You want to save tokens

**Use agent teams when:**
- Teammates need to share findings and challenge each other
- You want true parallel work across independent modules
- The task benefits from different perspectives (e.g., competing hypotheses)
- Work spans multiple layers (frontend, backend, tests)

## Examples for the deep-research codebase

### Subagent examples

**1. Explore subagent — understand the streaming flow**
```
Use an explore subagent to trace how a user's research topic flows from
SearchInput through useChat() to the API route and back as streaming parts
```

**2. Custom code-reviewer subagent**

Create `.claude/agents/research-reviewer.md`:
```markdown
---
name: research-reviewer
description: Reviews deep-research code for quality, streaming correctness, and AI SDK v6 patterns. Use after code changes.
tools: Read, Grep, Glob
model: haiku
---

You are a code reviewer for a Next.js deep-research app using Vercel AI SDK v6.

When reviewing, check:
- Correct use of message.parts[] (not message.content) for streaming
- Tool parts have proper state handling ("call" vs "result")
- API route correctly defines tools with Zod schemas
- Environment variables are not hardcoded
- React components handle all UI states (loading, streaming, error, complete)

Provide feedback organized by priority: Critical, Warnings, Suggestions.
```

**3. Run tests/build in a subagent to keep context clean**
```
Use a subagent to run `npm run build` in the deep-research directory
and report only errors and warnings
```

**4. Parallel research with subagents**
```
Research these three things in parallel using separate subagents:
1. How the Exa API search tool is defined in route.ts
2. How StepDisplay extracts search queries from message parts
3. How ResearchReport renders the final markdown
```

### Agent team examples

**1. Multi-perspective feature review**
```
Create an agent team to review adding a "save research report" feature:
- One teammate on UX (where does the save button go, what formats)
- One teammate on technical architecture (file storage, API endpoint)
- One teammate checking how it interacts with the existing streaming flow
```

**2. Parallel debugging**
```
The research report sometimes cuts off mid-stream. Create an agent team
with 3 teammates to investigate different hypotheses:
- One checking the maxSteps limit and tool call loop in route.ts
- One checking client-side rendering in page.tsx and ResearchReport
- One checking OpenRouter API response handling and error cases
Have them challenge each other's findings.
```

**3. Cross-layer feature implementation**
```
Create an agent team to add a "research history" feature:
- Teammate 1: Backend — new API route for saving/loading past research
- Teammate 2: Frontend — history sidebar component and navigation
- Teammate 3: Data layer — localStorage or database schema for persistence
```

## Key takeaway

**Subagents are your go-to for everyday delegation** — cheap, fast, focused. **Agent teams are for when you need agents to actually talk to each other** and work on something genuinely complex in parallel, but they cost significantly more tokens and are still experimental.

## Sources

- [Subagents documentation](https://code.claude.com/docs/en/sub-agents)
- [Agent Teams documentation](https://code.claude.com/docs/en/agent-teams)
