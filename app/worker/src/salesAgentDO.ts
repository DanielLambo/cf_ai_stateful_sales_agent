import { DurableObject } from "cloudflare:workers";

export interface Env {
    AI: any;
    SALES_AGENT: DurableObjectNamespace;
    FINALIZE_CALL: any;
}

export class SalesAgent extends DurableObject {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/internal/chat" && request.method === "POST") {
            try {
                const body = await request.json() as { message: string };
                return Response.json({
                    reply: `Echo: ${body.message}`,
                    dealMemory: { status: "active" }
                });
            } catch (err) {
                return new Response("Bad Request", { status: 400 });
            }
        }

        if (url.pathname === "/internal/state") {
            return Response.json({
                state: "ready",
                transcript: []
            });
        }

        return new Response("Not found", { status: 404 });
    }
}
