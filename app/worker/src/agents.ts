// src/agent.ts
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

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

export type FinalOutputs = {
    summaryBullets: string[];
    actionItems: { owner: "Rep" | "Customer"; item: string }[];
    followupEmail: string;
} | null;

export type AgentState = {
    messages: ChatMsg[];
    rollingSummary: string;   // compressed memory
    dealMemory: DealMemory;   // structured memory
    final: FinalOutputs;      // workflow output
    userTurnCount: number;    // to decide when to refresh memory
};

export const DEFAULT_STATE: AgentState = {
    messages: [],
    rollingSummary: "",
    dealMemory: {
        customerName: "",
        company: "",
        industry: "",
        painPoints: [],
        budget: "",
        timeline: "",
        objections: [],
        nextSteps: [],
    },
    final: null,
    userTurnCount: 0,
};
