import { Service } from "@/data/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-cyan-500/50 hover:bg-zinc-900 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200"
    >
      <div className="text-3xl mb-3">{service.icon}</div>
      <h3 className="font-bold text-white group-hover:text-cyan-400 transition">{service.name}</h3>
      <p className="text-zinc-500 text-sm mt-1">{service.description}</p>
    </a>
  );
}
