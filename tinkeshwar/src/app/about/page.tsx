export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">About</h1>
      <div className="space-y-4 text-zinc-400">
        <p>
          I&apos;m Tinkeshwar — a software engineer who loves building things that run 24/7 on bare metal.
          My home server is an AMD Ryzen 5 7600 machine running Ubuntu, hosting everything from media streaming to AI-powered video optimization.
        </p>
        <h2 className="text-lg font-bold text-white mt-6">Home Lab Specs</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>CPU: AMD Ryzen 5 7600 (6-core)</li>
          <li>RAM: 16 GB DDR5</li>
          <li>OS: Ubuntu 24.04 LTS</li>
          <li>Storage: Multi-disk (media1, media2, ocean, cloud)</li>
          <li>VPN: WireGuard via Gluetun → Linode VPS</li>
          <li>Proxy: Nginx Proxy Manager with Let&apos;s Encrypt</li>
          <li>GPU: AMD integrated (VAAPI hardware transcoding)</li>
        </ul>
        <h2 className="text-lg font-bold text-white mt-6">Tech Stack</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Docker & Docker Compose for all services</li>
          <li>Cloudflare DNS with dynamic IP updates</li>
          <li>Automated media management (Sonarr, Radarr, Prowlarr)</li>
          <li>AI video optimization pipeline</li>
          <li>Immich for photo backup & management</li>
        </ul>
      </div>
    </div>
  );
}
