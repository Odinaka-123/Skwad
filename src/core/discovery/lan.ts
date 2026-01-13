import dgram from "dgram";

export const DISCOVERY_PORT = 45454;
export const DISCOVERY_INTERVAL_MS = 2500;

export interface LanDiscoveryIdentity {
  skwadId: string;
  deviceCode: string;
  publicKeyHex: string;
  port: number;
}

export interface DiscoveredPeer extends LanDiscoveryIdentity {
  ip: string;
}

export function startLanDiscovery(
  identity: LanDiscoveryIdentity,
  onPeerDiscovered: (peer: DiscoveredPeer) => void
) {
  const socket = dgram.createSocket("udp4");
  const discoveredPeers = new Set<string>();

  // Bind the socket
  socket.bind(DISCOVERY_PORT, () => {
    socket.setBroadcast(true);
    identity.port = DISCOVERY_PORT; // update identity with actual port
    console.log("📡 LAN discovery started");
  });

  // Listen for discovery packets
  socket.on("message", (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.type !== "skwad-discovery") return;
      if (data.skwadId === identity.skwadId) return; // ignore self
      if (discoveredPeers.has(data.skwadId)) return; // already discovered

      discoveredPeers.add(data.skwadId);

      onPeerDiscovered({
        skwadId: data.skwadId,
        deviceCode: data.deviceCode,
        publicKeyHex: data.publicKeyHex,
        port: data.port,
        ip: rinfo.address,
      });
    } catch {
      // ignore malformed packets
    }
  });

  // Broadcast presence periodically
  const interval = setInterval(() => {
    const payload = Buffer.from(
      JSON.stringify({
        type: "skwad-discovery",
        skwadId: identity.skwadId,
        deviceCode: identity.deviceCode,
        publicKeyHex: identity.publicKeyHex,
        port: identity.port,
      })
    );

    socket.send(payload, 0, payload.length, DISCOVERY_PORT, "255.255.255.255");
  }, DISCOVERY_INTERVAL_MS);

  // Cleanup function
  return () => {
    clearInterval(interval);
    socket.close();
    console.log("🛑 LAN discovery stopped");
  };
}
