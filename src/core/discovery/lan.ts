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

export function startLanDiscovery(
  identity: LanDiscoveryIdentity,
  onPeerDiscovered: (peer: DiscoveredPeer) => void
) {
  const socket = dgram.createSocket({
    type: "udp4",
    reuseAddr: true, // REQUIRED on Windows
  });

  const seenDevices = new Set<string>();

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
      if (seenDevices.has(data.deviceCode)) return;

      seenDevices.add(data.deviceCode);

      onPeerDiscovered({
        skwadId: data.skwadId,
        deviceCode: data.deviceCode,
        publicKeyHex: data.publicKeyHex,
        tcpPort: data.tcpPort,
        ip: rinfo.address,
      });
    } catch {
      // ignore
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
    console.log("🛑 LAN discovery stopped");
  };
}
