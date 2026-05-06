import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function readFile(path: string): string {
  try {
    return readFileSync(path, "utf-8").trim();
  } catch {
    return "";
  }
}

function getCpuUsage(): { usage: number; cores: number; model: string } {
  const stat = readFile("/host/proc/stat");
  const cpuLine = stat.split("\n")[0];
  const parts = cpuLine.split(/\s+/).slice(1).map(Number);
  const idle = parts[3] + parts[4];
  const total = parts.reduce((a, b) => a + b, 0);
  const usage = total > 0 ? Math.round(((total - idle) / total) * 100 * 10) / 10 : 0;

  const cpuinfo = readFile("/host/proc/cpuinfo");
  const modelMatch = cpuinfo.match(/model name\s*:\s*(.+)/);
  const coreMatches = cpuinfo.match(/processor\s*:/g);

  return {
    usage,
    cores: coreMatches?.length || 0,
    model: modelMatch?.[1] || "Unknown",
  };
}

function getMemory(): { used: number; total: number } {
  const meminfo = readFile("/host/proc/meminfo");
  const totalMatch = meminfo.match(/MemTotal:\s+(\d+)/);
  const availMatch = meminfo.match(/MemAvailable:\s+(\d+)/);
  const total = totalMatch ? parseInt(totalMatch[1]) / 1024 / 1024 : 0;
  const avail = availMatch ? parseInt(availMatch[1]) / 1024 / 1024 : 0;
  return { used: Math.round((total - avail) * 10) / 10, total: Math.round(total * 10) / 10 };
}

function getGpu(): { usage: number; vramUsed: number; vramTotal: number } {
  const busyPath = "/host/sys/class/drm/card0/device/gpu_busy_percent";
  const vramUsedPath = "/host/sys/class/drm/card0/device/mem_info_vram_used";
  const vramTotalPath = "/host/sys/class/drm/card0/device/mem_info_vram_total";

  return {
    usage: existsSync(busyPath) ? parseInt(readFile(busyPath)) || 0 : 0,
    vramUsed: existsSync(vramUsedPath) ? Math.round((parseInt(readFile(vramUsedPath)) || 0) / 1024 / 1024) : 0,
    vramTotal: existsSync(vramTotalPath) ? Math.round((parseInt(readFile(vramTotalPath)) || 0) / 1024 / 1024) : 0,
  };
}

function getTemperature(): number {
  const zones = ["/host/sys/class/thermal/thermal_zone0/temp", "/host/sys/class/hwmon/hwmon0/temp1_input"];
  for (const z of zones) {
    if (existsSync(z)) {
      const val = parseInt(readFile(z));
      if (val > 0) return Math.round(val / 1000);
    }
  }
  return 0;
}

function getUptime(): string {
  const raw = readFile("/host/proc/uptime");
  const seconds = Math.floor(parseFloat(raw.split(" ")[0]) || 0);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function getDisks(): { mount: string; used: number; total: number }[] {
  try {
    const output = execSync("df -BG /cloud /media1 /media2 /ocean 2>/dev/null || df -BG / 2>/dev/null", {
      encoding: "utf-8",
    });
    const lines = output.trim().split("\n").slice(1);
    return lines.map((line) => {
      const parts = line.split(/\s+/);
      const total = parseInt(parts[1]) || 0;
      const used = parseInt(parts[2]) || 0;
      const mount = parts[5] || "/";
      return { mount, used, total };
    });
  } catch {
    return [];
  }
}

interface DockerContainer {
  Names?: string[];
  State?: string;
  Status?: string;
}

interface DockerImage {
  RepoTags?: string[] | null;
}

async function getDocker(): Promise<{
  running: number;
  stopped: number;
  staleImages: number;
  totalImages: number;
  unhealthy: string[];
}> {
  try {
    const containersRaw = execSync(
      'curl -s --unix-socket /var/run/docker.sock "http://localhost/containers/json?all=true"',
      { encoding: "utf-8" }
    );
    const containers: DockerContainer[] = JSON.parse(containersRaw);
    const running = containers.filter((c) => c.State === "running").length;
    const stopped = containers.filter((c) => c.State === "exited").length;
    const unhealthy = containers
      .filter((c) => c.Status?.includes("unhealthy"))
      .map((c) => c.Names?.[0]?.replace("/", "") || "unknown");

    const imagesRaw = execSync(
      'curl -s --unix-socket /var/run/docker.sock "http://localhost/images/json"',
      { encoding: "utf-8" }
    );
    const images: DockerImage[] = JSON.parse(imagesRaw);
    const totalImages = images.length;
    const staleImages = images.filter((i) => !i.RepoTags || i.RepoTags[0] === "<none>:<none>").length;

    return { running, stopped, staleImages, totalImages, unhealthy };
  } catch {
    return { running: 0, stopped: 0, staleImages: 0, totalImages: 0, unhealthy: [] };
  }
}

export async function GET() {
  const [cpu, memory, gpu, temperature, uptime, disks, docker] = await Promise.all([
    getCpuUsage(),
    getMemory(),
    getGpu(),
    getTemperature(),
    getUptime(),
    getDisks(),
    getDocker(),
  ]);

  return NextResponse.json({ cpu, memory, gpu, temperature, uptime, disks, docker });
}
