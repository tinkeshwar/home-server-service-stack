"use client";

export default function StatCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}
