import StatsPanel from "@/components/StatsPanel";
import TorrentStatus from "@/components/TorrentStatus";

export default function Home() {
  return (
    <div>
      <StatsPanel />
      <div className="mt-4">
        <TorrentStatus />
      </div>
    </div>
  );
}
