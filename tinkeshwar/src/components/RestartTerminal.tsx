"use client";

import { useState, useRef, useEffect } from "react";

export default function RestartTerminal() {
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [token, setToken] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const termRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const execute = async () => {
    setShowConfirm(false);
    setRunning(true);
    setLines([]);
    setElapsed(0);

    try {
      const res = await fetch("/api/restart", {
        method: "POST",
        headers: { "x-admin-token": token },
      });

      if (!res.ok) {
        setLines([`[ERROR] ${res.status}: ${await res.text()}`]);
        setRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const events = text.split("\n\n").filter(Boolean);
        for (const event of events) {
          const match = event.match(/^data: (.+)$/m);
          if (match) {
            const data = match[1];
            if (data === "[DONE]") break;
            setLines((prev) => [...prev, JSON.parse(data)]);
          }
        }
      }
    } catch (err) {
      setLines((prev) => [...prev, `[ERROR] ${err}`]);
    }
    setRunning(false);
  };

  const colorize = (line: string) => {
    if (line.startsWith("[ERROR]")) return "text-red-400";
    if (line.startsWith("✓")) return "text-green-400";
    if (line.startsWith("✗")) return "text-red-400";
    if (line.includes("Stopping")) return "text-yellow-400";
    if (line.includes("Starting")) return "text-green-400";
    if (line.includes("Restarting")) return "text-cyan-400";
    if (line.includes("Waiting")) return "text-purple-400";
    return "text-zinc-300";
  };

  return (
    <div className="mt-8 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-3 text-zinc-500 text-xs">restart-vpn-stack</span>
        </div>
        {running && <span className="text-xs text-zinc-500">{elapsed}s</span>}
      </div>

      {lines.length > 0 && (
        <div ref={termRef} className="bg-black p-4 max-h-64 overflow-y-auto font-mono text-sm">
          {lines.map((line, i) => (
            <div key={i} className={`${colorize(line)} animate-fade-in`}>
              <span className="text-zinc-600 mr-2">$</span>{line}
            </div>
          ))}
          {running && <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1" />}
        </div>
      )}

      <div className="p-4 bg-zinc-950 flex items-center gap-3">
        <input
          type="password"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500 flex-1 max-w-xs"
        />
        <button
          onClick={() => setShowConfirm(true)}
          disabled={running || !token}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {running ? "Running..." : "🔄 Restart VPN Stack"}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-sm text-center">
            <p className="text-white font-bold mb-2">⚠️ Confirm Restart</p>
            <p className="text-zinc-400 text-sm mb-4">This will restart all VPN-dependent services. Continue?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition">
                Cancel
              </button>
              <button onClick={execute} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition">
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
