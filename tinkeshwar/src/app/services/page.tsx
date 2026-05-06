import { services } from "@/data/services";
import ServiceCard from "@/components/ServiceCard";
import RestartTerminal from "@/components/RestartTerminal";

export default function ServicesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Services</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {services.map((s) => (
          <ServiceCard key={s.name} service={s} />
        ))}
      </div>
      <RestartTerminal />
    </div>
  );
}
