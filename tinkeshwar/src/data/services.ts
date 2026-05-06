export interface Service {
  name: string;
  description: string;
  url: string;
  icon: string;
}

export const services: Service[] = [
  { name: "Jellyfin", description: "Media streaming server", url: "https://jellyfin.tinkeshwar.in", icon: "🎬" },
  { name: "Jellyseerr", description: "Media request management", url: "https://jellyseerr.tinkeshwar.in", icon: "🎯" },
  { name: "Photos", description: "Photo & video backup", url: "https://photos.tinkeshwar.in", icon: "📸" },
  { name: "Explorer", description: "File management", url: "https://explorer.tinkeshwar.in", icon: "📁" },
  { name: "Logs", description: "Container log viewer", url: "https://dlogs.tinkeshwar.in", icon: "📋" },
  { name: "Torrent", description: "Torrent client", url: "https://torrent.tinkeshwar.in", icon: "⬇️" },
  { name: "Deluge", description: "Torrent client", url: "https://deluge.tinkeshwar.in", icon: "🌊" },
  { name: "Sonarr", description: "TV show automation", url: "https://sonarr.tinkeshwar.in", icon: "📺" },
  { name: "Radarr", description: "Movie automation", url: "https://radarr.tinkeshwar.in", icon: "🎥" },
  { name: "Prowlarr", description: "Indexer management", url: "https://prowlarr.tinkeshwar.in", icon: "🔍" },
  { name: "Whisparr", description: "Adult content automation", url: "https://whisparr3.tinkeshwar.in", icon: "🔞" },
  { name: "WUD", description: "Container update detection", url: "https://wud.tinkeshwar.in", icon: "🔄" },
];
