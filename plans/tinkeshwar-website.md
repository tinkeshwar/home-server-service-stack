# Plan: tinkeshwar.in — Personal Website (Next.js on Docker)

## Overview

A personal website for **tinkeshwar.in** built with Next.js, running as a Docker container alongside the existing home server service stack. The site serves as a personal dashboard/portal and public-facing landing page.

---

## Goals

- Personal landing page with bio, links, and projects
- Home server service status dashboard (shows running services)
- Quick-access links to self-hosted services (Jellyfin, Immich, Filebrowser, etc.)
- Clean, modern, dark-themed UI that matches a home-lab aesthetic
- Lightweight, fast, and SEO-friendly (SSR via Next.js)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Container | Docker (multi-stage build) |
| Reverse Proxy | Existing Nginx Proxy Manager |

---

## Pages & Features

### 1. Landing / Hero (`/`)
- Name, tagline, avatar/photo
- Social links (GitHub, LinkedIn, etc.)
- Brief intro paragraph

### 2. Services Dashboard (`/services`)
- Grid of cards for each self-hosted service
- Service name, icon, description, and link
- Services: Jellyfin, Jellyseerr, Immich, Filebrowser, Dozzle, qBittorrent, Sonarr, Radarr, Prowlarr
- Optional: live status indicator (green/red dot) via Docker socket or health checks

### 3. Projects (`/projects`)
- Showcase personal projects (e.g., video-optimizer-ai, mempalace)
- Card layout with description, tech stack, and links

### 4. About (`/about`)
- Detailed bio, skills, home server hardware specs
- Tech stack overview of the home lab

---

## Directory Structure

```
tinkeshwar/
├── Dockerfile
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── services/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   └── page.tsx
│   │   └── about/
│   │       └── page.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ServiceCard.tsx
│   │   └── ProjectCard.tsx
│   └── data/
│       ├── services.ts
│       └── projects.ts
```

---

## Docker Integration

### Dockerfile (multi-stage)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### docker-compose.yml addition
```yaml
tinkeshwar-web:
  container_name: tinkeshwar-web
  build: ./tinkeshwar
  restart: unless-stopped
  environment:
    - TZ=Asia/Kolkata
```

Expose via Nginx Proxy Manager → `tinkeshwar.in` → `tinkeshwar-web:3000`

---

## Implementation Steps

1. **Scaffold** — Initialize Next.js project in `tinkeshwar/` with TypeScript + Tailwind
2. **Layout & Theme** — Dark theme, responsive nav, footer
3. **Landing Page** — Hero section with name, tagline, social links
4. **Services Page** — Data-driven grid of service cards with links
5. **Projects Page** — Showcase projects
6. **About Page** — Bio and home lab details
7. **Dockerfile** — Multi-stage production build
8. **Compose Update** — Add `tinkeshwar-web` service to `docker-compose.yml`
9. **Proxy Config** — Point `tinkeshwar.in` to the container via Nginx Proxy Manager

---

## Service Links Data

| Service | Internal URL | Description |
|---------|-------------|-------------|
| Jellyfin | gluetun:8096 | Media streaming |
| Jellyseerr | gluetun:5055 | Media requests |
| Immich | immich-server:2283 | Photo management |
| Filebrowser | filebrowser:8080 | File management |
| Dozzle | dozzle:8080 | Container logs |
| qBittorrent | gluetun:8080 | Torrent client |
| Sonarr | gluetun:8989 | TV automation |
| Radarr | gluetun:7878 | Movie automation |
| Prowlarr | gluetun:9696 | Indexer manager |

> Note: Public URLs will be configured via Nginx Proxy Manager subdomains.

---

## Design Notes

- Dark background (`#0a0a0a` / zinc-950) with accent color (blue/cyan)
- Monospace font for headings (home-lab vibe)
- Subtle animations on hover (cards lift/glow)
- Fully responsive (mobile-first)
- Minimal dependencies — no heavy UI libraries

---

## Feature: One-Click VPN Restart (`restart-is.sh`)

### UI
- A prominent "Restart VPN Stack" button on the Services Dashboard
- On click, triggers the script execution via API route
- Cool terminal-style animation showing real-time progress:
  - Animated terminal window (dark bg, green monospace text)
  - Each step streams in line-by-line with a typing/typewriter effect
  - Container names highlight in cyan as they stop/start
  - Spinner animation while waiting for gluetun to stabilize
  - Green checkmark (✓) on success, red (✗) on failure per container
  - Progress bar showing overall completion (stop → restart VPN → start)

### Implementation

#### API Route (`src/app/api/restart/route.ts`)
- POST endpoint that spawns `restart-is.sh` as a child process
- Streams stdout/stderr back via Server-Sent Events (SSE)
- Protected with a simple auth token (env var `ADMIN_TOKEN`)

#### Frontend Component (`src/components/RestartTerminal.tsx`)
- Connects to SSE endpoint on button click
- Renders output in a faux-terminal with:
  - Blinking cursor
  - Line-by-line typewriter animation (50ms per char)
  - Color-coded output (stop = yellow, start = green, error = red)
  - Auto-scroll to bottom
- States: idle → running → complete/error
- Disable button while running, show elapsed time

#### Docker Integration
- Mount Docker socket into `tinkeshwar-web` container:
  ```yaml
  tinkeshwar-web:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./restart-is.sh:/app/scripts/restart-is.sh:ro
  ```
- Script runs inside the container with access to Docker daemon

#### Security
- Button only visible after entering admin token (stored in session)
- Rate-limited (1 execution per 60 seconds)
- Confirmation modal before execution: "This will restart all VPN-dependent services. Continue?"

---

## Future Enhancements

- Real-time service health via Docker API
- System stats (CPU, RAM, disk) via a lightweight API endpoint
- Blog section (MDX-based)
- Authentication for private dashboard sections
