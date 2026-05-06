export interface Project {
  name: string;
  description: string;
  tech: string[];
  url?: string;
}

export const projects: Project[] = [
  {
    name: "Video Optimizer AI",
    description: "AI-powered video transcoding and optimization pipeline using hardware acceleration",
    tech: ["Python", "FFmpeg", "VAAPI", "Docker"],
    url: "https://github.com/tinkeshwar/video-optimizer-ai",
  },
  {
    name: "Mempalace",
    description: "Personal knowledge management and memory palace tool",
    tech: ["TypeScript", "Node.js"],
    url: "https://github.com/tinkeshwar/mempalace",
  },
  {
    name: "Home Server Stack",
    description: "Self-hosted media and productivity services running on Docker",
    tech: ["Docker", "WireGuard", "Nginx", "Linux"],
    url: "https://github.com/tinkeshwar/home-server-service-stack",
  },
];
