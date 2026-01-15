import sodium from "libsodium-wrappers-sumo";
import { loadOrCreateIdentity, deviceCode } from "../core/crypto/identity.js";
import { startTcpServer } from "../net/tcp/server.js";
import { connectToPeer } from "../net/tcp/client.js";
import { startLanDiscovery } from "../core/discovery/lan.js";

/* ====== CLI args ====== */
function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const PROFILE = getArg("--profile") ?? "default";
const SKWAD_ID = getArg("--skwad") ?? "default";
const TCP_PORT = Number(getArg("--port") ?? 45454);

/* ====== MAIN ====== */
async function main() {
  await sodium.ready;
  const identity = await loadOrCreateIdentity(PROFILE);

  console.log("🟢 Skwad ID:", SKWAD_ID);
  console.log("🆔 Device Code:", deviceCode(identity.publicKeyX));
  console.log(`🔌 TCP server will listen on ${TCP_PORT}`);

  // TCP server
  startTcpServer(TCP_PORT, {
    publicKey: Uint8Array.from(Buffer.from(identity.publicKeyX, "hex")),
    privateKey: Uint8Array.from(Buffer.from(identity.privateKeyX, "hex")),
  });

  const seen = new Set<string>();

  // LAN discovery
  const stopDiscovery = startLanDiscovery(
    {
      skwadId: SKWAD_ID,
      deviceCode: deviceCode(identity.publicKeyX),
      publicKeyHex: identity.publicKeyX,
      tcpPort: TCP_PORT,
    },
    (peer) => {
      if (peer.publicKeyHex === identity.publicKeyX || seen.has(peer.publicKeyHex)) return;
      seen.add(peer.publicKeyHex);

      console.log("🔍 LAN peer discovered:", peer);

      connectToPeer(peer.ip, peer.tcpPort, {
        publicKey: Uint8Array.from(Buffer.from(identity.publicKeyX, "hex")),
        privateKey: Uint8Array.from(Buffer.from(identity.privateKeyX, "hex")),
      });
    }
  );

  process.on("SIGINT", () => {
    stopDiscovery();
    console.log("🛑 Exiting...");
    process.exit(0);
  });
}

main();
