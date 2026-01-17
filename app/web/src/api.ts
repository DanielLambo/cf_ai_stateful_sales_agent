/**
 * API Client for Sales Agent Worker
 */

const API_BASE = "http://localhost:8787";

export type Message = {
    role: "user" | "assistant";
    content: string;
};

export type DealMemory = {
    customerName: string;
    company: string;
    industry: string;
    painPoints: string[];
    budget: string;
    timeline: string;
    objections: string[];
    nextSteps: string[];
};

export type AgentState = {
    messages: Message[];
    dealMemory: DealMemory;
    rollingSummary: string;
    userTurnCount: number;
    final?: {
        summaryBullets: string[];
        actionItems: { owner: string; item: string }[];
        followupEmail: string;
    };
};

export type ChatResponse = {
    reply: string;
    followUps: string[];
    dealMemory: DealMemory;
    rollingSummary: string;
    userTurnCount: number;
};

export const api = {
    async sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, message }),
        });
        if (!res.ok) throw new Error("Failed to send message");
        return res.json();
    },

    async endCall(sessionId: string): Promise<{ ok: boolean; workflowId: string }> {
        const res = await fetch(`${API_BASE}/api/end-call`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
        });
        if (!res.ok) throw new Error("Failed to end call");
        return res.json();
    },

    async getDebugState(sessionId: string): Promise<AgentState> {
        const res = await fetch(`${API_BASE}/api/debug?sessionId=${sessionId}`);
        if (!res.ok) throw new Error("Failed to fetch state");
        return res.json();
    },

    async resetState(sessionId: string): Promise<void> {
        await fetch(`${API_BASE}/api/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
        });
    },
};
