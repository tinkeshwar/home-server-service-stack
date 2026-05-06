# Plan: Live System Stats on Home Page

## Overview

Display real-time system metrics on the landing page — CPU, RAM, GPU, disk usage, container status, stale images, and recent errors. Data refreshes via polling an internal API that reads from the host system.

---

## Metrics to Display

### System Resources
| Metric | Source | Display |
|--------|--------|---------|
| CPU Usage (%) | `/proc/stat` or `top` | Animated ring/gauge |
| RAM Used / Total | `/proc/meminfo` | Progress bar + text |
| GPU Usage & VRAM | `radeontop` or `/sys/class/drm` | Progress bar |
| CPU Temperature | `/sys/class/thermal` or `sensors` | Color-coded value |
| Uptime | `/proc/uptime` | Human-readable string |

### Disk Usage
| Mount | Source | Display |
|-------|--------|---------|
| /cloud | `df` | Progress bar |
| /media1 | `df` | Progress bar |
| /media2 | `df` | Progress bar |
| /ocean | `df` | Progress bar |

### Docker Stats
| Metric | Source | Display |
|--------|--------|---------|
| Running containers | Docker API `/containers/json` | Count badge (green) |
| Stopped containers | Docker API `?filters={"status":["exited"]}` | Count badge (yellow) |
| Stale/dangling images | Docker API `/images/json?filters={"dangling":["true"]}` | Count badge (red) |
| Total images | Docker API `/images/json` | Count |
| Recent errors (last 10) | Docker API `/containers/{id}/logs?since=1h&stderr=true` | Scrollable list |
| Containers with restarts > 0 | Docker API inspect `RestartCount` | Warning list |

---

## Architecture

```
Browser (polling every 5s)
    ↓ fetch
/api/stats (Next.js API route)
    ↓ reads
Docker socket (/var/run/docker.sock)
Host filesystem (/host/proc, /host/sys) via bind mounts
```

### Docker Compose Volume Additions
```yaml
tinkeshwar-web:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ./restart-is.sh:/app/scripts/restart-is.sh:ro
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
```

---

## API Design

### `GET /api/stats`

Response:
```json
{
  "cpu": { "usage": 23.5, "cores": 6, "model": "AMD Ryzen 5 7600" },
  "memory": { "used": 8.2, "total": 15.1, "unit": "GB" },
  "gpu": { "usage": 12, "vram_used": 0.4, "vram_total": 2.0 },
  "temperature": { "cpu": 52 },
  "uptime": "14d 6h 32m",
  "disks": [
    { "mount": "/cloud", "used": 120, "total": 500, "unit": "GB" },
    { "mount": "/media1", "used": 1800, "total": 2000, "unit": "GB" },
    { "mount": "/media2", "used": 3200, "total": 4000, "unit": "GB" },
    { "mount": "/ocean", "used": 800, "total": 8000, "unit": "GB" }
  ],
  "docker": {
    "running": 18,
    "stopped": 2,
    "staleImages": 5,
    "totalImages": 22,
    "unhealthy": ["container_name"],
    "recentErrors": [
      { "container": "radarr", "message": "connection refused", "time": "2m ago" }
    ]
  }
}
```

---

## UI Layout (Home Page)

```
┌─────────────────────────────────────────────────┐
│  Hero (existing: name, tagline, links)          │
├─────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐ │
│  │  CPU %  │ │  RAM    │ │  GPU    │ │ Temp │ │
│  │  gauge  │ │  bar    │ │  bar    │ │  52°C│ │
│  └─────────┘ └─────────┘ └─────────┘ └──────┘ │
├─────────────────────────────────────────────────┤
│  Disks                                          │
│  /cloud   ████████░░░░░░  120/500 GB            │
│  /media1  █████████████░  1.8/2.0 TB            │
│  /media2  ████████████░░  3.2/4.0 TB            │
│  /ocean   ██░░░░░░░░░░░░  0.8/8.0 TB           │
├─────────────────────────────────────────────────┤
│  Docker                                         │
│  🟢 18 running  🟡 2 stopped  🔴 5 stale imgs  │
│                                                 │
│  Recent Errors (collapsible)                    │
│  • radarr: connection refused (2m ago)          │
│  • sonarr: timeout (15m ago)                    │
└─────────────────────────────────────────────────┘
```

---

## Components

| Component | Purpose |
|-----------|---------|
| `StatsPanel.tsx` | Parent client component, fetches `/api/stats` every 5s |
| `GaugeRing.tsx` | Circular SVG gauge for CPU % |
| `ProgressBar.tsx` | Reusable horizontal bar (RAM, GPU, disks) |
| `DockerStatus.tsx` | Container counts + error list |
| `StatCard.tsx` | Wrapper card with label + value |

---

## Implementation Steps

1. Add `/host/proc` and `/host/sys` bind mounts to `docker-compose.yml`
2. Create `GET /api/stats/route.ts` — reads proc/sys files + Docker socket
3. Create `GaugeRing`, `ProgressBar`, `StatCard` components
4. Create `DockerStatus` component with error list
5. Create `StatsPanel` parent that polls and renders all sub-components
6. Integrate `StatsPanel` into the home page below the hero

---

## Reading System Metrics (inside container)

### CPU Usage
```ts
// Parse /host/proc/stat twice with 1s delay, calculate delta
```

### RAM
```ts
// Parse /host/proc/meminfo → MemTotal, MemAvailable
```

### GPU (AMD via sysfs)
```ts
// /host/sys/class/drm/card0/device/gpu_busy_percent
// /host/sys/class/drm/card0/device/mem_info_vram_used
// /host/sys/class/drm/card0/device/mem_info_vram_total
```

### Temperature
```ts
// /host/sys/class/thermal/thermal_zone0/temp (divide by 1000)
```

### Uptime
```ts
// /host/proc/uptime → first value in seconds
```

### Disks
```ts
// Execute: df -B1 /host/proc/mounts targets or use statfs
// Alternative: mount host paths and use statvfs
```

---

## Security Notes

- `/api/stats` is read-only, no auth required (public info)
- Proc/sys mounted as read-only (`:ro`)
- Docker socket access already exists for restart feature
- No sensitive data exposed (no env vars, no passwords)

---

## Refresh Strategy

- Poll every 5 seconds via `setInterval` in client component
- Show subtle pulse animation on values when they update
- Skeleton loading state on first render
- Graceful fallback if API is unreachable (show "offline" badge)
