import { Project } from "@/data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200">
      <h3 className="font-bold text-white">{project.name}</h3>
      <p className="text-zinc-500 text-sm mt-1">{project.description}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {project.tech.map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-cyan-400">
            {t}
          </span>
        ))}
      </div>
      {project.url && (
        <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition">
          View →
        </a>
      )}
    </div>
  );
}
