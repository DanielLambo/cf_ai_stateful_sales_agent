# AI Prompts Used

This project was built with the assistance of AI agentic coding. Below is a log of the key prompts and interactions used to build, debug, and refine the application.

## 1. Project Initialization & Structure
- **Prompt**: "Create Project Structure for a Cloudflare Workers + Durable Objects + Pages app"
- **Action**: Set up the monorepo structure with `app/worker` and `app/web`.

## 2. Infrastructure & Configuration
- **Prompt**: "Configure Wrangler Bindings for Durable Objects and Workers AI"
- **Action**: Updated `wrangler.jsonc` with `durable_objects`, `ai`, and `workflows` bindings.
- **Prompt**: "Fix Cloudflare Env Type Error"
- **Action**: Resolved TypeScript mismatches in `Env` interface for Durable Objects.

## 3. Core Development
- **Prompt**: "Implement Sales Agent Durable Object with rolling summaries"
- **Action**: Created `salesAgentDO.ts` with state management, message history, and Llama 3 deduction.
- **Prompt**: "Frontend Setup and Fixes"
- **Action**: Built the React `App.tsx` chat interface and configured Tailwind CSS.

## 4. Debugging & Refinement
- **Prompt**: "Explain what this problem is and help me fix it: 'AgentState' is declared but never used."
- **Action**: Cleaned up unused interfaces and refined type definitions.
- **Prompt**: "when i click end call it does not actually show me the chat summary"
- **Action**: Diagnosed timeout issues; increased frontend polling duration to 90s to accommodate Workflow execution time.

## 5. Polish & Security
- **Prompt**: "Refine Sales Agent System Prompt with guardrails"
- **Action**: Added strict instructions to avoid answering CFPB/FDIC violations and fixed XML tag leakage in responses.
- **Prompt**: "Final Engineering Review & Polish"
- **Action**:
    -   Enforced storage limits (max 40 messages).
    -   Added strict input validation (SessionID length, Message length).
    -   Standardized CORS headers.
    -   Cleaned up comments for professionalism.
