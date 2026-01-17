import { useMemo, useState, useEffect, useRef } from "react";
import { MessageCircle, Send, PhoneOff, RefreshCw, Layers, LayoutDashboard, Sparkles, Info, Lightbulb, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

interface DealMemory {
  customerName?: string;
  company?: string;
  painPoints?: string[];
  budget?: string;
  timeline?: string;
}

interface AgentState {
  messages: Msg[];
  rollingSummary?: string;
  dealMemory: DealMemory;
  final?: {
    summaryBullets?: string[];
    emailDraft?: string;
  };
}

function newSessionId() {
  return "session-" + Math.random().toString(16).slice(2);
}

const SAMPLE_PROMPTS = [
  "The customer says your product is too expensive compared to competitors.",
  "They're concerned about the implementation timeline being too long.",
  "The prospect says they're happy with their current solution.",
  "They don't see the ROI and want more concrete numbers.",
  "The decision maker is worried about getting buy-in from their team.",
];

export default function App() {
  const [sessionId] = useState(() => newSessionId());
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [dealMemory, setDealMemory] = useState<DealMemory>({});
  const [loading, setLoading] = useState(false);
  const [final, setFinal] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [rollingSummary, setRollingSummary] = useState<string>("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  const apiBase = useMemo(() => {
    return "http://localhost:8787";
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send(text?: string) {
    const message = text || input.trim();
    if (!message || loading) return;

    setLoading(true);
    setStatus("");
    setFinal(null);
    setShowGuide(false);

    setMsgs((m) => [...m, { role: "user", content: message }]);
    setInput("");

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });

      if (!res.ok) throw new Error(`chat failed: ${res.status}`);
      const data = await res.json();

      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.dealMemory) setDealMemory(data.dealMemory);
      if (data.rollingSummary) setRollingSummary(data.rollingSummary);
    } catch (e: any) {
      setStatus(e?.message ?? "Request failed");
      setMsgs((m) => [...m, { role: "assistant", content: "Error connecting to agent." }]);
    } finally {
      setLoading(false);
    }
  }

  async function endCall() {
    if (!confirm("End call and generate report?")) return;
    setStatus("Generating report (this may take a minute)...");
    setFinal(null);
    setIsFinalizing(true);

    try {
      const res = await fetch(`${apiBase}/api/end-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error(`end-call failed: ${res.status}`);

      const start = Date.now();
      // Workflow involves 3x Llama 70b calls, so we give it ample time (90s)
      while (Date.now() - start < 90000) {
        const r = await fetch(`${apiBase}/api/results?sessionId=${encodeURIComponent(sessionId)}`);
        if (r.ok) {
          const out = await r.json();
          if (out?.final) {
            setFinal(out.final);
            setStatus("Done.");
            setIsFinalizing(false);
            return;
          }
        }
        await new Promise((x) => setTimeout(x, 1200));
      }

      setStatus("Still processing. Try again in a few seconds.");
      setIsFinalizing(false);
    } catch (e: any) {
      setStatus(e?.message ?? "End call failed");
      setIsFinalizing(false);
    }
  }

  async function handleReset() {
    if (!confirm("Reset all state?")) return;
    setMsgs([]);
    setDealMemory({});
    setFinal(null);
    setRollingSummary("");
    setStatus("");
    setIsFinalizing(false);
    setShowGuide(true);
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100 text-slate-900 font-sans overflow-hidden">

      {/* LEFT: Deal Intelligence Panel */}
      <div className="w-96 border-r border-slate-200 bg-white/80 backdrop-blur-sm p-6 overflow-y-auto hidden lg:block shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <h2 className="font-bold tracking-tight text-slate-900 text-base">Deal Intelligence</h2>
        </div>

        <div className="space-y-4">
          {rollingSummary && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-orange-600" />
                <h3 className="text-xs text-slate-600 uppercase font-bold tracking-wide">Rolling Summary</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {rollingSummary}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <MemoryItem label="Customer" value={dealMemory.customerName} />
            <MemoryItem label="Company" value={dealMemory.company} />
            <MemoryItem label="Pain Points" value={dealMemory.painPoints} isList />
            <MemoryItem label="Budget" value={dealMemory.budget} />
            <MemoryItem label="Timeline" value={dealMemory.timeline} />
          </div>

          {final && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 p-4 rounded-xl shadow-lg mt-6">
              <h3 className="text-emerald-700 font-bold mb-2 flex items-center gap-2">
                <Layers size={16} /> Post-Call Report Ready
              </h3>
              <p className="text-xs text-emerald-600 mb-3">Workflow completed successfully.</p>
              <div className="space-y-2 text-sm text-emerald-800">
                <p><strong>Summary:</strong> {final.summaryBullets?.length || 0} points</p>
                <p><strong>Email Draft:</strong> Ready</p>
              </div>
            </div>
          )}

          {!rollingSummary && !Object.values(dealMemory).some(v => v) && !final && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <LayoutDashboard size={24} className="text-orange-600" />
              </div>
              <p className="text-slate-500 text-sm">Deal data will appear here</p>
              <p className="text-slate-400 text-xs mt-1">Try a sample prompt to see it in action</p>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-orange-600" />
            <h3 className="font-bold text-sm text-slate-900">How It Works</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>🎯 <strong>Real-time Deal Tracking:</strong> Extracts customer info, pain points, budget, and timeline as you chat</p>
            <p>💡 <strong>AI-Powered Coaching:</strong> Get instant objection handling strategies and best practices</p>
            <p>📊 <strong>Post-Call Reports:</strong> Click "End Call" to generate summary bullets and follow-up email drafts</p>
          </div>
        </div>

        {/* Founder Badge */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                DL
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 mb-0.5">Built by Daniel Lambo</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Computer Science @ Alabama A&M University • Exploring AI agents, sales automation, and full-stack development
                </p>
                <div className="flex gap-2 mt-2">
                  <a href="https://github.com/DanielLambo" target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-600 hover:text-orange-700 font-medium">
                    GitHub →
                  </a>
                  <a href="https://www.linkedin.com/in/daniel-lambo/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-600 hover:text-orange-700 font-medium">
                    LinkedIn →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Chat Interface */}
      <div className="flex-1 flex flex-col relative bg-white">

        {/* Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Sales Coach AI" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="font-bold text-lg text-slate-900">Sales Objection Coach</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
                <span className="text-xs text-slate-500 font-medium">AI-Powered Sales Training Platform</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200"
              title="Toggle Guide"
            >
              <Info size={18} />
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200"
              title="Reset Session"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={endCall}
              disabled={isFinalizing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md ${isFinalizing
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-200"
                }`}
            >
              <PhoneOff size={16} />
              {isFinalizing ? "Finalizing..." : "End Call"}
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth bg-gradient-to-br from-slate-50/50 to-orange-50/20">

          {/* Guide Overlay */}
          {showGuide && msgs.length === 0 && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Welcome to Sales Objection Coach! 👋</h2>
                      <p className="text-orange-100 text-sm">AI-powered role-play training for handling customer objections</p>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="text-white/80 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Info size={18} className="text-orange-600" />
                      What This Does
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm text-slate-700">
                      <p>✨ <strong>Practice objection handling</strong> with an AI sales coach that responds in real-time</p>
                      <p>📋 <strong>Automatic deal tracking</strong> extracts customer name, company, pain points, budget, and timeline</p>
                      <p>🎯 <strong>Get coached</strong> on best practices and proven strategies for overcoming objections</p>
                      <p>📊 <strong>Generate reports</strong> with post-call summaries and follow-up email drafts</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Lightbulb size={18} className="text-orange-600" />
                      Try These Sample Objections
                    </h3>
                    <div className="space-y-2">
                      {SAMPLE_PROMPTS.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => send(prompt)}
                          className="w-full text-left p-3 bg-gradient-to-r from-slate-50 to-orange-50 hover:from-orange-50 hover:to-orange-100 border border-slate-200 hover:border-orange-300 rounded-lg transition-all text-sm text-slate-700 hover:text-slate-900 group"
                        >
                          <span className="font-medium text-orange-600 group-hover:text-orange-700">→</span> {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Tip:</strong> Type any customer objection scenario and the AI coach will help you navigate it with proven techniques and real-time feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State (when guide is hidden) */}
          {!showGuide && msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <MessageCircle size={40} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to practice</h3>
              <p className="text-slate-500 text-sm max-w-md text-center mb-4">
                Start the conversation with a customer objection
              </p>
              <button
                onClick={() => setShowGuide(true)}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
              >
                <Info size={14} />
                Show guide & sample prompts
              </button>
            </div>
          )}

          {/* Messages */}
          {msgs.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl p-4 shadow-md text-sm leading-relaxed ${m.role === "user"
                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tr-md"
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-md"
                }`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex w-full justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md p-4 flex items-center gap-2 shadow-md">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
            </div>
          )}

          <div ref={bottomRef}></div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 shadow-lg">
          {status && (
            <div className="max-w-4xl mx-auto mb-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-medium">
              {status}
            </div>
          )}
          <div className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type what the customer said..."
              disabled={loading}
              className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm disabled:opacity-50 placeholder:text-slate-400"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 p-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function MemoryItem({ label, value, isList }: { label: string, value?: string | string[], isList?: boolean }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[10px] tracking-wider text-slate-500 uppercase font-bold mb-1.5">{label}</div>
      {isList && Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v, i) => (
            <span key={i} className="px-2.5 py-1 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 text-xs rounded-md border border-orange-200 font-medium shadow-sm">
              {v}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-slate-900 text-sm font-semibold">{value}</div>
      )}
    </div>
  );
}