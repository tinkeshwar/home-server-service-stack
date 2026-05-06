"use client";

interface DockerStats {
  running: number;
  stopped: number;
  staleImages: number;
  totalImages: number;
  unhealthy: string[];
}

export default function DockerStatus({ docker }: { docker: DockerStats }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Badge color="green" label="Running" value={docker.running} />
        <Badge color="yellow" label="Stopped" value={docker.stopped} />
        <Badge color="red" label="Stale Images" value={docker.staleImages} />
        <Badge color="zinc" label="Total Images" value={docker.totalImages} />
      </div>
      {docker.unhealthy.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-red-400 mb-1">⚠️ Unhealthy:</p>
          {docker.unhealthy.map((c) => (
            <span key={c} className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded mr-1">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ color, label, value }: { color: string; label: string; value: number }) {
  const colors: Record<string, string> = {
    green: "bg-green-900/30 text-green-400",
    yellow: "bg-yellow-900/30 text-yellow-400",
    red: "bg-red-900/30 text-red-400",
    zinc: "bg-zinc-800 text-zinc-400",
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg ${colors[color] || colors.zinc}`}>
      <span className="text-lg font-bold mr-1">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
