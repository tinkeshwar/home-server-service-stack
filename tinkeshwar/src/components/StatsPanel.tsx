"use client";

import { useEffect, useState } from "react";
import GaugeRing from "./GaugeRing";
import ProgressBar from "./ProgressBar";
import StatCard from "./StatCard";
import DockerStatus from "./DockerStatus";

interface Stats {
  cpu: { usage: number; cores: number; model: string };
  memory: { used: number; total: number };
  gpu: { usage: number; vramUsed: number; vramTotal: number };
  temperature: number;
  uptime: string;
  disks: { mount: string; used: number; total: number }[];
  docker: { running: number; stopped: number; staleImages: number; totalImages: number; unhealthy: string[] };
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = () =>
      fetch("/api/stats")
        .then((r) => r.json())
        .then((d) => { setStats(d); setError(false); })
        .catch(() => setError(true));

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="mt-10 text-center text-zinc-600 text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
        Stats unavailable
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-zinc-900 border border-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-4">
      {/* System Resources */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="CPU">
          <GaugeRing value={stats.cpu.usage} label={`${stats.cpu.cores} cores`} />
        </StatCard>
        <StatCard title="Memory">
          <ProgressBar label="RAM" used={stats.memory.used} total={stats.memory.total} color="purple" />
          <p className="text-xs text-zinc-600 mt-2">{Math.round((stats.memory.used / stats.memory.total) * 100)}% used</p>
        </StatCard>
        <StatCard title="GPU">
          <GaugeRing value={stats.gpu.usage} label={`${stats.gpu.vramUsed}/${stats.gpu.vramTotal} MB`} color="green" />
        </StatCard>
        <StatCard title="System">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Temp</span>
              <span className={stats.temperature > 70 ? "text-red-400" : stats.temperature > 55 ? "text-yellow-400" : "text-green-400"}>
                {stats.temperature}°C
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Uptime</span>
              <span className="text-white">{stats.uptime}</span>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Disks */}
      {stats.disks.length > 0 && (
        <StatCard title="Storage">
          <div className="space-y-3">
            {stats.disks.map((d) => (
              <ProgressBar key={d.mount} label={d.mount} used={d.used} total={d.total} color="cyan" />
            ))}
          </div>
        </StatCard>
      )}

      {/* Docker */}
      <StatCard title="Docker">
        <DockerStatus docker={stats.docker} />
      </StatCard>
    </div>
  );
}
