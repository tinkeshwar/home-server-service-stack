"use client";

export default function ProgressBar({
  label,
  used,
  total,
  unit = "GB",
  color = "cyan",
}: {
  label: string;
  used: number;
  total: number;
  unit?: string;
  color?: string;
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-400",
    green: "bg-green-400",
    purple: "bg-purple-400",
    yellow: "bg-yellow-400",
    red: "bg-red-400",
  };

  const barColor = pct > 90 ? "bg-red-400" : pct > 75 ? "bg-yellow-400" : (colorMap[color] || "bg-cyan-400");

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">{used}/{total} {unit}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
