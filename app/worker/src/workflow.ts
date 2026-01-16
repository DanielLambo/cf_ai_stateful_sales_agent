// src/workflows.ts
import { WorkflowEntrypoint } from "cloudflare:workers";

export class FinalizeCallWorkflow extends WorkflowEntrypoint {
    async run(event: any, env: any, ctx: ExecutionContext) {
        // Placeholder for now so Wrangler is happy.
        // We’ll implement summary → next steps → follow-up email next.
        const { sessionId } = event?.payload ?? {};

        if (!sessionId) {
            throw new Error("Missing sessionId in workflow payload");
        }

        return { ok: true, sessionId };
    }
}
