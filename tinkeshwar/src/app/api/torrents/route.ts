import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const QB_URL = process.env.QB_URL || "http://gluetun:8080";
const QB_USER = process.env.QB_USER || "admin";
const QB_PASS = process.env.QB_PASS || "adminadmin";
const DELUGE_URL = process.env.DELUGE_URL || "http://gluetun:8112";
const DELUGE_PASS = process.env.DELUGE_PASS || "deluge";

export interface Torrent {
  name: string;
  progress: number;
  size: number;
  dlSpeed: number;
  upSpeed: number;
  eta: number;
  state: string;
  client: "qbittorrent" | "deluge";
}

async function getQbitTorrents(): Promise<{ torrents: Torrent[]; dlSpeed: number; upSpeed: number }> {
  try {
    // Login
    const loginRes = await fetch(`${QB_URL}/api/v2/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${QB_USER}&password=${QB_PASS}`,
    });
    const cookie = loginRes.headers.get("set-cookie") || "";

    // Get torrents
    const res = await fetch(`${QB_URL}/api/v2/torrents/info`, {
      headers: { Cookie: cookie },
    });
    const data = await res.json();

    const torrents: Torrent[] = data.map((t: Record<string, unknown>) => ({
      name: t.name as string,
      progress: Math.round((t.progress as number) * 100),
      size: t.size as number,
      dlSpeed: t.dlspeed as number,
      upSpeed: t.upspeed as number,
      eta: t.eta as number,
      state: mapQbState(t.state as string),
      client: "qbittorrent" as const,
    }));

    const dlSpeed = data.reduce((sum: number, t: Record<string, unknown>) => sum + (t.dlspeed as number || 0), 0);
    const upSpeed = data.reduce((sum: number, t: Record<string, unknown>) => sum + (t.upspeed as number || 0), 0);

    return { torrents, dlSpeed, upSpeed };
  } catch {
    return { torrents: [], dlSpeed: 0, upSpeed: 0 };
  }
}

function mapQbState(state: string): string {
  const map: Record<string, string> = {
    downloading: "downloading",
    stalledDL: "stalled",
    uploading: "seeding",
    stalledUP: "seeding",
    pausedDL: "paused",
    pausedUP: "paused",
    queuedDL: "queued",
    queuedUP: "queued",
    checkingDL: "checking",
    checkingUP: "checking",
    error: "error",
  };
  return map[state] || state;
}

async function getDelugeTorrents(): Promise<{ torrents: Torrent[]; dlSpeed: number; upSpeed: number }> {
  try {
    const rpc = async (method: string, params: unknown[] = []) => {
      const res = await fetch(`${DELUGE_URL}/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, params, id: Date.now() }),
      });
      return res.json();
    };

    // Auth
    await rpc("auth.login", [DELUGE_PASS]);
    await rpc("web.connected");

    // Get torrents
    const result = await rpc("web.update_ui", [
      ["name", "progress", "total_size", "download_payload_rate", "upload_payload_rate", "eta", "state"],
      {},
    ]);

    const torrentMap = result?.result?.torrents || {};
    const torrents: Torrent[] = Object.values(torrentMap).map((t: unknown) => {
      const torrent = t as Record<string, unknown>;
      return {
        name: torrent.name as string,
        progress: Math.round(torrent.progress as number),
        size: torrent.total_size as number,
        dlSpeed: torrent.download_payload_rate as number,
        upSpeed: torrent.upload_payload_rate as number,
        eta: (torrent.eta as number) || 0,
        state: (torrent.state as string || "").toLowerCase(),
        client: "deluge" as const,
      };
    });

    const dlSpeed = torrents.reduce((sum, t) => sum + t.dlSpeed, 0);
    const upSpeed = torrents.reduce((sum, t) => sum + t.upSpeed, 0);

    return { torrents, dlSpeed, upSpeed };
  } catch {
    return { torrents: [], dlSpeed: 0, upSpeed: 0 };
  }
}

export async function GET() {
  const [qbit, deluge] = await Promise.all([getQbitTorrents(), getDelugeTorrents()]);

  return NextResponse.json({
    torrents: [...qbit.torrents, ...deluge.torrents],
    totalDlSpeed: qbit.dlSpeed + deluge.dlSpeed,
    totalUpSpeed: qbit.upSpeed + deluge.upSpeed,
    qbitCount: qbit.torrents.length,
    delugeCount: deluge.torrents.length,
  });
}
