# Sub-Agents vs Agent Teams: Comprehensive Research Report

*Compiled 2026-03-04 from three parallel research agents*

---

## Executive Summary

The AI agent ecosystem has converged on two fundamental multi-agent patterns: **sub-agents** (hierarchical delegation from an orchestrator) and **agent teams** (peer collaboration). Most production frameworks now offer both, with the industry trending toward **hybrid approaches**. The pragmatic consensus: default to sub-agents for most tasks, use teams only when negotiation or multi-perspective synthesis is required, and always start with a single agent first.

---

## 1. Definitions

### Sub-Agents (Hierarchical Delegation)
A parent orchestrator agent decomposes a task, spawns child agents for focused subtasks, collects results, and synthesizes a final output. Communication flows hub-and-spoke — sub-agents report to the parent, never to each other.

**Key properties:**
- Context isolation (each sub-agent gets its own clean context window)
- Scoped tool access (restricted to relevant tools)
- Only final results return to parent, not full reasoning traces
- Parent controls lifecycle: creation, invocation, termination

### Agent Teams (Peer Collaboration)
Collections of agents that collaborate as peers through message passing, shared state, or handoff protocols. No single point of control — agents communicate laterally.

**Key properties:**
- Peer-to-peer or supervised collaboration
- Role-based specialization with defined personas
- Shared or distributed memory
- Flexible topology (static or dynamic)

### The Core Distinction
**Control flow.** Sub-agents follow hub-and-spoke where the orchestrator is always in the loop. Teams can implement peer networks, round-robin discussions, or dynamic handoffs where control transfers entirely between agents.

---

## 2. Architectural Patterns

### Pattern 1: Hierarchical (Orchestrator + Sub-Agents)
Orchestrator decomposes → spawns sub-agents (serial or parallel) → sub-agents execute → orchestrator synthesizes.

- **Used by:** Claude Agent SDK, LangGraph (agent-as-tool), CrewAI (hierarchical), Amazon Bedrock, Google ADK
- **Strengths:** Clear accountability, centralized error handling, strong context isolation
- **Weaknesses:** Orchestrator bottleneck, every sub-agent call adds latency

### Pattern 2: Flat/Peer Teams
Agents communicate directly based on expertise matching. Any agent can initiate with any other.

- **Used by:** AutoGen (conversation-driven), LangGraph (multi-agent network)
- **Strengths:** No single point of failure, natural for debate/critique
- **Weaknesses:** Coordination overhead grows quadratically, harder to debug

### Pattern 3: Swarm / Handoff-Based
Only one agent active at a time. Active agent hands off full conversation to a more appropriate agent.

- **Used by:** OpenAI Agents SDK, LangGraph Swarm
- **Strengths:** Lightweight, focused context, natural for customer service routing
- **Weaknesses:** No parallel execution, hard to maintain global task state

### Pattern 4: Pipeline / Sequential
Fixed linear order — Agent A → Agent B → Agent C. Each transforms the previous output.

- **Used by:** CrewAI (sequential), Google ADK (SequentialAgent)
- **Strengths:** Predictable, easy to audit, good for compliance
- **Weaknesses:** Slowest (no parallelism), any failure blocks the pipeline

---

## 3. Framework Implementations

### Claude Code
Offers **both patterns as first-class features**:
- **Sub-agents** (since 2025): Defined as Markdown files in `.claude/agents/` with YAML frontmatter. Each gets isolated context (up to 200k tokens), scoped tools, focused prompts. Cannot spawn other sub-agents (single-level hierarchy). Can run concurrently.
- **Agent Teams** (February 2026, with Opus 4.6): Teammates spawn in parallel git worktrees, share a task list with dependency tracking, and can message each other directly. When one teammate finishes a blocking task, dependent tasks unblock automatically.

### LangGraph
Most explicit architectural choice — ships **supervisor** and **swarm** as separate installable libraries:
- `langgraph-supervisor`: Central supervisor controls all routing and delegation
- `langgraph-swarm`: Peer agents with explicit handoff tools, no central coordinator
- Swarm achieves ~40% faster end-to-end times by avoiding supervisor round-trips

### CrewAI
Built entirely around the **team metaphor** with role-playing agents (Role, Goal, Backstory):
- Sequential, Hierarchical, and Parallel process types
- Dual architecture: Crews (autonomous teams) + Flows (deterministic pipelines)
- Can embed a Crew inside a Flow for both flexibility and predictability

### AutoGen (Microsoft)
**Conversation-driven** approach using the actor model:
- RoundRobinGroupChat, SelectorGroupChat, and Swarm team types
- Being merged with Semantic Kernel into unified Microsoft Agent Framework (GA targeting Q1 2026)
- Magentic-One: flagship multi-agent team for web browsing, code execution, file handling

### OpenAI Agents SDK
**Handoff-centric** — agents transfer control via `transfer_to_<agent_name>` tools:
- One agent active at a time; full conversation history transfers on handoff
- Nested handoffs compress prior history into summaries
- Patterns: triage-to-specialist, role-based delegation, multi-stage workflows

### Amazon Bedrock
**Strictly hierarchical**, fully managed:
- Supervisor Mode (full orchestration) and Supervisor with Routing Mode (optimized for simple requests)
- Max 10 collaborator agents per supervisor
- No peer-to-peer communication

### Google ADK
- CoordinatorAgent manages specialist sub_agents
- AutoFlow for automatic routing based on agent descriptions
- Workflow Agents (Sequential, Parallel, Loop) for deterministic orchestration without LLM routing
- Shared session state with unique key requirements per agent

---

## 4. Comparison Matrix

| Framework | Primary Pattern | Peer Communication | Parallel Execution | Handoff Mechanism |
|---|---|---|---|---|
| **Claude Code** | Hybrid (both) | Agent Teams only | Yes (worktrees) | Task list + messaging |
| **LangGraph** | Choice (both) | Swarm mode only | Yes | Handoff tools |
| **CrewAI** | Teams-first | Via shared context | Yes (Flows) | Task delegation |
| **AutoGen** | Teams | Group chat broadcast | Yes (async actors) | Conversation turns |
| **OpenAI Agents SDK** | Sub-agents | No | No (serial) | transfer_to tools |
| **Amazon Bedrock** | Sub-agents | No | Supervisor can | Supervisor routing |
| **Google ADK** | Hybrid | Via shared state | ParallelAgent | AutoFlow routing |

---

## 5. Context Management

### Isolated Context (Sub-Agent Pattern)
Each sub-agent gets a fresh context window. Only results return to the parent.

- Prevents context explosion (passing full history triggers exponential token growth)
- Each agent stays focused on its narrow task
- But sub-agents lack awareness of each other's work
- Anthropic persists the lead agent's research plan to external memory before hitting the 200k token limit, then spawns fresh sub-agents with clean contexts

### Shared Context (Team Pattern)
Agents share a common memory or message space.

- Agents build on each other's findings, reducing redundant work
- But context poisoning risk — one agent's bad output corrupts shared state
- Concurrency issues when multiple agents write simultaneously
- Costs scale exponentially as agents re-explain context to each other

### Emerging Best Practice
**Context isolation with scoped sharing.** Each agent gets its own context window, but specific outputs are selectively shared through structured memory stores (not raw conversation history). Use unique keys per agent when writing to shared state.

---

## 6. Cost and Token Usage

### The Numbers
- Standard single agents use **4x more tokens** than chat interactions
- Multi-agent systems use approximately **15x more tokens** than standard chat
- Token duplication rates: 72% (MetaGPT), 86% (CAMEL), 53% (AgentVerse)

### Sub-Agents vs Teams
- **Sub-agents**: ~67% fewer tokens due to context isolation. Consistent per-request cost. One extra call for results flowing back through parent.
- **Teams**: Save 40-50% of calls on repeat requests (stateful), but context accumulates over time. LLM-mediated inter-agent communication doubles token usage.

### Optimization Strategies
- Cache LLM responses for identical/similar inputs
- Store sub-agent outputs to external filesystems rather than passing through conversation history
- Use smaller models for sub-agents (Anthropic: Opus orchestrator, Sonnet workers)
- Share only Role Definition and Output Formats as system prompts, not full context

---

## 7. Failure Modes

### Hierarchical/Sub-Agent Failures
- **Orchestrator bottleneck**: Single point of failure — if it misplans, all sub-agents do wrong work
- **Cascade failures**: Minor prompt changes cascade into large behavioral changes
- **Effort miscalibration**: Spawning 50 sub-agents for simple queries, or endlessly searching for nonexistent sources

### Team/Peer Failures
- **Coordination breakdown**: 41-86.7% failure rates in production due to specification ambiguity
- **Context poisoning**: One agent's flawed assumptions become shared "ground truth"
- **Duplicate work**: Without clear boundaries, agents overlap or leave gaps

### Error Handling Best Practices
1. Classify errors (rate limits → retry; garbage output → reformulate; missing input → human intervention)
2. Retry with exponential backoff for transient errors
3. Checkpoint recovery to survive crashes
4. Typed schemas at every boundary — fail fast on violations
5. Idempotency tokens for deduplication on retries
6. Circuit breakers to prevent cascading failures
7. Treat agents like distributed systems, not chat flows

---

## 8. Vendor Guidance

### Anthropic
Progressive complexity ladder: Augmented LLM → Prompt Chaining → Routing → Parallelization → Orchestrator-Workers → Evaluator-Optimizer → Autonomous Agents. Core principle: "Start with the simplest solution, add complexity only when needed."

Their multi-agent research system (Opus orchestrator + Sonnet sub-agents) achieved 90.2% better performance than single-agent Opus. Key: give each sub-agent one job; let the orchestrator handle global planning.

### OpenAI
Two patterns: Agents-as-Tools (manager owns the conversation) and Handoffs (specialist becomes the active agent). Design principle: "Keep agents lightweight, stateless, and bound by explicit handoff functions."

### Google
Eight patterns from simple to complex. Key guidance: "Start simple. Do not build a nested loop system on day one." Effective team sizes limited to ~3-4 agents before coordination overhead grows super-linearly (exponent ~1.724).

### All Three Agree On
- Start simple, add agents only when justified
- Give each agent a narrow, well-defined role
- Invest heavily in tool/interface design
- Build robust evaluation before scaling
- Treat multi-agent systems as distributed systems

---

## 9. Emerging Trends (2025-2026)

1. **Context engineering as a discipline** — systematic management of what context each agent receives
2. **MCP (Model Context Protocol)** — converging standard for agent-tool interfaces (Google, Anthropic, open-source)
3. **Smaller specialized models for sub-agents** — powerful orchestrator + cheaper workers becoming standard
4. **Memory engineering** — moving beyond conversation history to structured, queryable agent memory
5. **Agent-to-agent protocols** — A2A (Google) and similar standards for inter-agent communication
6. **Hybrid architectures** — combining hierarchical orchestration with peer collaboration within sub-teams
7. **Gartner reports 1,445% surge** in multi-agent system inquiries from Q1 2024 to Q2 2025

---

## 10. Decision Framework

| Factor | Sub-Agents | Agent Teams |
|--------|-----------|-------------|
| **Best for** | Decomposable, parallelizable tasks | Negotiation, debate, dynamic adaptation |
| **Control** | Centralized, predictable | Distributed, resilient |
| **Debugging** | Easier (clear hierarchy) | Harder (emergent behavior) |
| **Token cost** | ~67% fewer (isolated context) | Higher (shared context) |
| **Failure mode** | Orchestrator bottleneck | Coordination breakdown |
| **Scaling** | Add hierarchy layers | Add peers (but coordination grows super-linearly) |
| **Production maturity** | More battle-tested | Emerging, less standardized |

### When to Use Sub-Agents
- Task naturally decomposes into independent subtasks
- You need centralized control over planning and quality
- Subtasks don't require heavy inter-agent communication
- Work benefits from parallelization
- You want predictable control flow and easier debugging

### When to Use Agent Teams
- Problem requires negotiation or multiple perspectives
- Agents need to adapt dynamically to each other's outputs
- You want resilience (no single point of failure)
- Environment is highly dynamic and unpredictable

### The Sweet Spot
- **3-7 agents** for most systems
- Below 3: a single agent usually suffices
- Above 7: coordination complexity outweighs benefits unless using hierarchical structures
- Default to orchestrator-worker, add peer collaboration only when evaluation proves it necessary

---

## Sources

### Anthropic
- [How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Building Agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Claude Code Sub-Agents Docs](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Agent Teams Docs](https://code.claude.com/docs/en/agent-teams)
- [Claude Agent SDK: Subagents](https://platform.claude.com/docs/en/agent-sdk/subagents)

### Google
- [Multi-Agent Patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
- [Context-Aware Multi-Agent Framework for Production](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)
- [Towards a Science of Scaling Agent Systems](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)
- [Google ADK Multi-Agents Docs](https://google.github.io/adk-docs/agents/multi-agents/)

### OpenAI
- [Agents SDK: Handoffs](https://openai.github.io/openai-agents-python/handoffs/)
- [Agents SDK: Multi-Agent Orchestration](https://openai.github.io/openai-agents-python/multi_agent/)
- [Agents SDK Overview](https://openai.github.io/openai-agents-python/)

### Microsoft
- [AutoGen Teams Documentation](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html)
- [AutoGen v0.4 Announcement](https://www.microsoft.com/en-us/research/blog/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/)
- [Semantic Kernel Agent Orchestration](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-orchestration/)

### AWS
- [Bedrock Multi-Agent Collaboration](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent-collaboration.html)
- [Evaluating AI Agents at Amazon](https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-lessons-from-building-agentic-systems-at-amazon/)

### LangChain
- [LangGraph Supervisor](https://github.com/langchain-ai/langgraph-supervisor-py)
- [Choosing the Right Multi-Agent Architecture](https://blog.langchain.com/choosing-the-right-multi-agent-architecture/)
- [Hierarchical Agent Teams Tutorial](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/hierarchical_agent_teams/)

### CrewAI
- [CrewAI Agents Documentation](https://docs.crewai.com/en/concepts/agents)
- [CrewAI Processes](https://docs.crewai.com/en/concepts/processes)

### Practitioner Reports
- [GitHub Blog: Multi-Agent Workflows Often Fail](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/)
- [Agents Arcade: Benefits and Pitfalls](https://agentsarcade.com/blog/multi-agent-systems-benefits-pitfalls-real-projects)
- [Augment Code: Why Multi-Agent LLM Systems Fail](https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them)
- [Cleanlab: AI Agents in Production 2025](https://cleanlab.ai/ai-agents-in-production-2025/)
- [Galileo: Benchmarking Multi-Agent AI](https://galileo.ai/blog/benchmarks-multi-agent-ai)

### Research Papers
- [MultiAgentBench (arxiv 2503.01935)](https://arxiv.org/abs/2503.01935)
- [REALM-Bench (arxiv 2502.18836)](https://arxiv.org/abs/2502.18836)
- [Collaborative Memory (arxiv 2505.18279)](https://arxiv.org/abs/2505.18279)
- [Single-agent or Multi-agent? Why Not Both? (arxiv 2505.18286)](https://arxiv.org/pdf/2505.18286)

### Comparisons & Overviews
- [Sitepoint: Orchestration Framework Comparison 2026](https://www.sitepoint.com/agent-orchestration-framework-comparison-2026/)
- [DataCamp: CrewAI vs LangGraph vs AutoGen](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen)
- [DEV Community: Multi-Agent Systems 2026 Guide](https://dev.to/eira-wexford/how-to-build-multi-agent-systems-complete-2026-guide-1io6)
