import sodium from "libsodium-wrappers-sumo";
import { loadOrCreateIdentity, deviceCode } from "../core/crypto/identity.js";
import { listPeers } from "../core/crypto/peers.js";
import { startLanDiscovery } from "../core/discovery/lan.js";
import { startTcpServer } from "../net/tcp/server.js";
import { connectToPeer } from "../net/tcp/client.js";
import { ed25519PkToCurve25519, ed25519SkToCurve25519 } from "../core/crypto/convert.js";

/* =========================
   CLI ARG HELPERS
========================= */
function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const PROFILE = getArg("--profile") ?? "default";
const SKWAD_ID = getArg("--skwad") ?? "default";
const TCP_PORT = Number(getArg("--port") ?? 45454);

/* =========================
   HEX → Uint8Array HELPER
========================= */
function hexToUint8(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

/* =========================
   MAIN
========================= */
async function main() {
  await sodium.ready;

  const identityRaw = await loadOrCreateIdentity(PROFILE);

  // Convert string keys to Uint8Array
  const identity = {
    publicKeyEd: hexToUint8(identityRaw.publicKeyEd),
    privateKeyEd: hexToUint8(identityRaw.privateKeyEd),
  };

  console.log("🟢 Skwad ID:", SKWAD_ID);
  console.log("🆔 Device Code:", deviceCode(identityRaw.publicKeyEd));
  console.log(`🔌 TCP server will listen on ${TCP_PORT}`);
  console.log("Trusted peers:", listPeers());

  /* =========================
     TCP SERVER
  ========================= */
  startTcpServer(TCP_PORT, {
    publicKeyEd: identity.publicKeyEd,
    privateKeyEd: identity.privateKeyEd,
  });

  /* =========================
     LAN DISCOVERY
  ========================== */
  const seen = new Set<string>();

  const stopDiscovery = startLanDiscovery(
    {
      skwadId: SKWAD_ID,
      deviceCode: deviceCode(identityRaw.publicKeyEd),
      publicKeyHex: identityRaw.publicKeyEd, // keep string for discovery
      tcpPort: TCP_PORT,
    },
    (peer) => {
      if (peer.publicKeyHex === identityRaw.publicKeyEd) return;
      if (seen.has(peer.publicKeyHex)) return;

      seen.add(peer.publicKeyHex);
      console.log("🔍 LAN peer discovered:", peer);

      try {
        connectToPeer(peer.ip, peer.tcpPort, {
          publicKeyEd: identity.publicKeyEd,
          privateKeyEd: identity.privateKeyEd,
        });
      } catch (err) {
        console.error("❌ Failed to initiate connection to peer:", (err as Error).message);
      }
    }
  );

  /* =========================
     CLEAN EXIT
  ========================== */
  process.on("SIGINT", () => {
    stopDiscovery();
    console.log("🛑 Exiting...");
    process.exit(0);
  });
}

main();
