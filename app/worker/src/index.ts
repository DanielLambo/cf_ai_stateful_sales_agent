import type { Env } from "./types";

export { SalesAgent } from "./salesAgentDO";
export { FinalizeCallWorkflow } from "./workflows";

export default {

	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// --- CORE CORS HANDLING ---
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		// Helper to wrap ANY response with CORS headers
		function withCors(resp: Response) {
			const h = new Headers(resp.headers);
			Object.entries(corsHeaders).forEach(([k, v]) => h.set(k, v));
			return new Response(resp.body, { status: resp.status, headers: h });
		}

		// Handle preflight requests
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// --- /api/chat ---
		if (url.pathname === "/api/chat" && request.method === "POST") {
			const { sessionId, message } = await request.json<{ sessionId: string; message: string }>().catch(() => ({ sessionId: "", message: "" }));

			// 1. Input Validation
			if (!sessionId || !message) {
				return withCors(new Response("Missing sessionId or message", { status: 400 }));
			}
			if (sessionId.length > 64) {
				return withCors(new Response("Session ID too long (max 64 chars)", { status: 400 }));
			}
			if (message.length > 4000) {
				return withCors(new Response("Message too long (max 4000 chars)", { status: 400 }));
			}

			const id = env.SALES_AGENT.idFromName(sessionId);
			const stub = env.SALES_AGENT.get(id);

			const resp = await stub.fetch("https://do/internal/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message }),
			});
			return withCors(resp);
		}

		// --- Diagnostic: Retrieve State ---
		if (url.pathname === "/api/results" && request.method === "GET") {
			const sessionId = url.searchParams.get("sessionId");
			if (!sessionId) return withCors(new Response("Missing sessionId", { status: 400 }));

			const id = env.SALES_AGENT.idFromName(sessionId);
			const stub = env.SALES_AGENT.get(id);

			const resp = await stub.fetch("https://do/internal/state");
			return withCors(resp);
		}

		// --- Diagnostic: Debug Alias ---
		if (url.pathname === "/api/debug" && request.method === "GET") {
			const sessionId = url.searchParams.get("sessionId");
			if (!sessionId) return withCors(new Response("Missing sessionId", { status: 400 }));

			const id = env.SALES_AGENT.idFromName(sessionId);
			const stub = env.SALES_AGENT.get(id);

			const resp = await stub.fetch("https://do/internal/state");
			return withCors(resp);
		}

		// --- /api/end-call ---
		if (url.pathname === "/api/end-call" && request.method === "POST") {
			const { sessionId } = await request.json<{ sessionId: string }>().catch(() => ({ sessionId: "" }));
			if (!sessionId) return withCors(new Response("Missing sessionId", { status: 400 }));

			// Start workflow instance
			const instance = await env.FINALIZE_CALL.create({ payload: { sessionId } });

			return withCors(Response.json({ ok: true, workflowId: instance.id }));
		}

		// --- Diagnostic: Reset State ---
		if (url.pathname === "/api/reset" && request.method === "POST") {
			const { sessionId } = await request.json<{ sessionId: string }>().catch(() => ({ sessionId: "" }));
			if (!sessionId) return withCors(new Response("Missing sessionId", { status: 400 }));

			const id = env.SALES_AGENT.idFromName(sessionId);
			const stub = env.SALES_AGENT.get(id);

			const resp = await stub.fetch("https://do/internal/reset", { method: "POST" });
			return withCors(resp);
		}

		return withCors(new Response("Not found", { status: 404 }));
	},
};
