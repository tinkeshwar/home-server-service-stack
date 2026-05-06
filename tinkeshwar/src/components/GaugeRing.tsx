"use client";

export default function GaugeRing({ value, label, color = "cyan" }: { value: number; label: string; color?: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const colorMap: Record<string, string> = {
    cyan: "stroke-cyan-400",
    green: "stroke-green-400",
    purple: "stroke-purple-400",
    red: "stroke-red-400",
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          className={`${colorMap[color] || "stroke-cyan-400"} transition-all duration-700`}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="text-white font-bold text-lg -mt-14">{value}%</span>
      <span className="text-zinc-500 text-xs mt-8">{label}</span>
    </div>
  );
}
