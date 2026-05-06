"use client";

import { useEffect, useState } from "react";

interface Torrent {
  name: string;
  progress: number;
  size: number;
  dlSpeed: number;
  upSpeed: number;
  eta: number;
  state: string;
  client: "qbittorrent" | "deluge";
}

interface TorrentData {
  torrents: Torrent[];
  totalDlSpeed: number;
  totalUpSpeed: number;
  qbitCount: number;
  delugeCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSpeed(bytes: number): string {
  return `${formatBytes(bytes)}/s`;
}

function formatEta(seconds: number): string {
  if (seconds <= 0 || seconds === 8640000) return "∞";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function stateColor(state: string): string {
  switch (state) {
    case "downloading": return "text-cyan-400";
    case "seeding": return "text-green-400";
    case "paused": return "text-yellow-400";
    case "error": return "text-red-400";
    case "stalled": return "text-orange-400";
    default: return "text-zinc-400";
  }
}

function clientBadge(client: "qbittorrent" | "deluge"): string {
  return client === "qbittorrent" ? "bg-blue-900/40 text-blue-400" : "bg-orange-900/40 text-orange-400";
}

export default function TorrentStatus() {
  const [data, setData] = useState<TorrentData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchData = () =>
      fetch("/api/torrents")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-48" />
      </div>
    );
  }

  const active = data.torrents.filter((t) => t.state === "downloading");
  const others = data.torrents.filter((t) => t.state !== "downloading");

  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider">Torrents</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-cyan-400">↓ {formatSpeed(data.totalDlSpeed)}</span>
          <span className="text-green-400">↑ {formatSpeed(data.totalUpSpeed)}</span>
        </div>
      </div>

      {/* Client counts */}
      <div className="flex gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded bg-blue-900/40 text-blue-400">
          qBit: {data.qbitCount}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-orange-900/40 text-orange-400">
          Deluge: {data.delugeCount}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-400">
          Active: {active.length}
        </span>
      </div>

      {/* Active downloads */}
      {active.length > 0 && (
        <div className="space-y-2 mb-3">
          {active.map((t, i) => (
            <TorrentRow key={`${t.client}-${i}`} torrent={t} />
          ))}
        </div>
      )}

      {active.length === 0 && (
        <p className="text-zinc-600 text-sm mb-3">No active downloads</p>
      )}

      {/* Toggle others */}
      {others.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition"
          >
            {expanded ? "▾" : "▸"} {others.length} other torrent{others.length > 1 ? "s" : ""}
          </button>
          {expanded && (
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
              {others.map((t, i) => (
                <TorrentRow key={`${t.client}-${i}`} torrent={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TorrentRow({ torrent }: { torrent: Torrent }) {
  return (
    <div className="bg-zinc-950 rounded-lg p-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs text-white truncate flex-1" title={torrent.name}>
          {torrent.name}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${clientBadge(torrent.client)}`}>
          {torrent.client === "qbittorrent" ? "qB" : "DL"}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            torrent.state === "downloading" ? "bg-cyan-400" :
            torrent.state === "seeding" ? "bg-green-400" : "bg-zinc-600"
          }`}
          style={{ width: `${torrent.progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className={stateColor(torrent.state)}>{torrent.state}</span>
        <span className="text-zinc-500">
          {torrent.progress}% · {formatBytes(torrent.size)}
          {torrent.dlSpeed > 0 && ` · ↓${formatSpeed(torrent.dlSpeed)}`}
          {torrent.eta > 0 && torrent.state === "downloading" && ` · ETA ${formatEta(torrent.eta)}`}
        </span>
      </div>
    </div>
  );
}
