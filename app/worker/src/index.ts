
export { SalesAgent } from "./salesAgentDO";

export interface Env {
	AI: any; // Workers AI binding
	SALES_AGENT: DurableObjectNamespace;
	FINALIZE_CALL: any; // Workflow binding (we will type later)
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// --- /api/chat ---
		if (url.pathname === "/api/chat" && request.method === "POST") {
			const { sessionId, message } = await request.json<{
				sessionId: string;
				message: string;
			}>();

			const id = env.SALES_AGENT.idFromName(sessionId);
			const stub = env.SALES_AGENT.get(id);

			const resp = await stub.fetch("https://do/internal/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message }),
			});

			return resp; // returns {reply, dealMemory}
		}

		// --- /api/results ---
		if (url.pathname === "/api/results" && request.method === "GET") {
			const sessionId = url.searchParams.get("sessionId");
			if (!sessionId) return new Response("Missing sessionId", { status: 400 });

			const id = env.SALES_AGENT.idFromName(sessionId);
			const stub = env.SALES_AGENT.get(id);

			const resp = await stub.fetch("https://do/internal/state");
			return resp; // includes final outputs when ready
		}

		// --- /api/end-call ---
		if (url.pathname === "/api/end-call" && request.method === "POST") {
			const { sessionId } = await request.json<{ sessionId: string }>();

			// Workflow trigger happens next step (we’ll implement)
			// For now return placeholder:
			return Response.json({ ok: true, message: "Workflow hook next." });
		}

		return new Response("Not found", { status: 404 });
	},
};
