# Sales Objection Coach (Edge AI)

This project is an AI-powered sales objection coaching tool built entirely on Cloudflare’s edge platform.  
It helps sales reps respond to objections in real time, maintain structured deal context, and automatically generate call summaries and follow-ups.

The goal was to build something **practical, stateful, and fast**, not a generic chatbot.

---

## What This Does

- Accepts live user input via a chat UI (Cloudflare Pages)
- Maintains per-session memory using Durable Objects
- Uses Workers AI (Llama 3.3) to generate:
  - speakable sales responses
  - structured deal memory
  - end-of-call summaries, action items, and follow-up emails
- Coordinates multi-step post-call processing using Cloudflare Workflows

Everything runs at the edge.

---

## Why I Built This

The inspiration for this comes from **my dad, who is a sales coach**. Growing up, I watched him help reps navigate tough conversations, and I wanted to see if I could capture some of that coaching intuition in software.

I also wanted to build a project that:
- demonstrated **real stateful AI**, not just stateless prompts
- used Cloudflare primitives the way they’re meant to be used
- solved a problem people immediately understand

Sales objections are a great test case for AI:
- they’re conversational
- they require memory
- they benefit from structured reasoning, not just text generation

This project intentionally avoids “chatbot demos” and focuses on **usable outputs**.

---

## Architecture (High Level)

- **Cloudflare Pages**  
  Frontend Chat UI for user input and real-time session interaction.

- **Workers AI (Llama 3.3)**  
  Explicitly used for all inference: real-time responses, memory extraction, and summaries.

- **Durable Objects (Coordination & State)**  
  One object per session that stores **messages, rolling summaries, and structured deal memory**.

- **Cloudflare Workflows**  
  Handles end-of-call processing (summary generation and email drafting) as a durable pipeline.

- **Cloudflare Workers**  
  Public API layer handling routing, validation, and orchestration.

---

## Key Design Decisions (and Why)

### Stateful AI via Durable Objects
I chose Durable Objects instead of external storage to keep:
- latency low
- session ownership clear
- memory tightly scoped per conversation

This avoids global state, race conditions, and over-fetching.

---

### Rolling Summaries Instead of Full History
Early versions stored full conversation history, which quickly became noisy and expensive.

I replaced that with:
- a rolling summary
- bounded recent messages

This keeps context useful and memory predictable.

---

### Plain-Text Responses (Not Forced JSON)
I initially forced strict JSON outputs from the model for chat replies.

That caused brittle parsing and repetitive fallback responses.

I fixed this by:
- allowing natural language for replies
- using structured extraction only where structure actually matters (deal memory, summaries)

This dramatically improved response quality.

---

## Mistakes I Made (and Fixed)

- **Over-constraining model output**  
  Fixed by separating conversational text from structured extraction.

- **State fields becoming `null` after schema changes**  
  Fixed by merging stored state with defaults on load.

- **Unbounded message growth**  
  Fixed by summarizing and trimming history intentionally.

These mistakes directly improved the final design.

---

## Founder’s Marker

This project is intentionally opinionated:

- responses are short and speakable
- memory is structured like a real rep thinks, not raw logs
- the UI shows only what’s actionable

A small easter egg:  
The UI color palette intentionally mirrors **Cloudflare’s brand colors** — orange accents with calm blues — as a nod to building *for* the platform, not just *on* it.

---

## Why Cloudflare

This project only works cleanly because of Cloudflare’s primitives:
- Durable Objects for session memory
- Workers AI for low-latency inference
- Workflows for durable coordination
- Pages for edge-native UI

Building this elsewhere would require stitching together multiple services.

---

## About Me

I’m a college student focused on systems, ML infrastructure, and building things end to end.  
This project reflects how I like to work: iterate, break things, fix them, and arrive at a clean, intentional design.

I learned to build this entire architecture using **Cloudflare documentation and the tutorials on the Cloudflare website**.

---

## Running locally

### 1) Start the Worker (API + Durable Objects + Workflows)
cd app/worker
npm install
npm run dev
# Worker runs on http://localhost:8787

### 2) Start the Pages UI (chat frontend)
cd ../web
npm install
npm run dev
# UI runs on the printed localhost URL (ex: http://localhost:5173)

### 3) Try it
- Type an objection (pricing, competitor, customer service)
- Click "End Call" to trigger the Workflow
- View generated summary/action items/email

