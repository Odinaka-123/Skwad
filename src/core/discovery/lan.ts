import dgram from "dgram";

export const DISCOVERY_PORT = 45460; // 🚫 NOT TCP PORT
export const DISCOVERY_INTERVAL_MS = 2500;
export const MULTICAST_ADDR = "239.255.0.1";

export interface LanDiscoveryIdentity {
  skwadId: string;
  deviceCode: string;
  publicKeyHex: string;
  tcpPort: number;
}

export interface DiscoveredPeer extends LanDiscoveryIdentity {
  ip: string;
}

/**
 * In-memory cache of discovered peers
 * Allows late-joining clients (mobile) to receive peers
 */
const discoveredPeers = new Map<string, DiscoveredPeer>();

export function getDiscoveredPeers(): DiscoveredPeer[] {
  return Array.from(discoveredPeers.values());
}

export function startLanDiscovery(
  identity: LanDiscoveryIdentity,
  onPeerDiscovered: (peer: DiscoveredPeer) => void
) {
  const socket = dgram.createSocket({
    type: "udp4",
    reuseAddr: true, // REQUIRED on Windows
  });

  socket.on("listening", () => {
    const addr = socket.address();
    console.log(`📡 LAN discovery started on ${addr.address}:${addr.port}`);
    socket.addMembership(MULTICAST_ADDR);
    socket.setMulticastLoopback(true); // allow same-machine discovery
  });

  socket.bind(DISCOVERY_PORT);

  socket.on("message", (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.type !== "skwad-discovery") return;
      if (data.skwadId !== identity.skwadId) return;
      if (data.deviceCode === identity.deviceCode) return;

      if (discoveredPeers.has(data.deviceCode)) return;

      const peer: DiscoveredPeer = {
        skwadId: data.skwadId,
        deviceCode: data.deviceCode,
        publicKeyHex: data.publicKeyHex,
        tcpPort: data.tcpPort,
        ip: rinfo.address,
      };

      discoveredPeers.set(peer.deviceCode, peer);

      console.log(`🔍 LAN peer discovered: ${peer.deviceCode} @ ${peer.ip}`);

      onPeerDiscovered(peer);
    } catch {
      // ignore malformed packets
    }
  });

  const interval = setInterval(() => {
    const payload = Buffer.from(
      JSON.stringify({
        type: "skwad-discovery",
        skwadId: identity.skwadId,
        deviceCode: identity.deviceCode,
        publicKeyHex: identity.publicKeyHex,
        tcpPort: identity.tcpPort,
      })
    );

    socket.send(payload, 0, payload.length, DISCOVERY_PORT, MULTICAST_ADDR);
  }, DISCOVERY_INTERVAL_MS);

  return () => {
    clearInterval(interval);
    socket.close();
    discoveredPeers.clear();
    console.log("🛑 LAN discovery stopped");
  };
}
