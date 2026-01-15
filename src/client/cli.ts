import sodium from "libsodium-wrappers-sumo";
import readline from "readline";

import { loadOrCreateIdentity, deviceCode } from "../core/crypto/identity.js";
import { listPeers } from "../core/crypto/peers.js";
import { startLanDiscovery } from "../core/discovery/lan.js";
import { startTcpServer } from "../net/tcp/server.js";
import { connectToPeer } from "../net/tcp/client.js";
import type { PeerSession } from "../net/tcp/client.js";

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
   HEX → Uint8Array
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
  const identity = {
    publicKeyEd: hexToUint8(identityRaw.publicKeyEd),
    privateKeyEd: hexToUint8(identityRaw.privateKeyEd),
  };

  console.log("🟢 Skwad ID:", SKWAD_ID);
  console.log("🆔 Device Code:", deviceCode(identityRaw.publicKeyEd));
  console.log(`🔌 TCP server listening on ${TCP_PORT}`);
  console.log("Trusted peers:", listPeers());

  /* =========================
     ACTIVE PEER SESSIONS
  ========================= */
  const peerSessions = new Map<string, PeerSession>();

  /* =========================
     TCP SERVER
  ========================= */
  startTcpServer(TCP_PORT, identity);

  /* =========================
     LAN DISCOVERY
  ========================= */
  const stopDiscovery = startLanDiscovery(
    {
      skwadId: SKWAD_ID,
      deviceCode: deviceCode(identityRaw.publicKeyEd),
      publicKeyHex: identityRaw.publicKeyEd,
      tcpPort: TCP_PORT,
    },
    async (peer) => {
      if (peer.publicKeyHex === identityRaw.publicKeyEd) return;
      if (peerSessions.has(peer.publicKeyHex)) return;

      // Deterministic dial rule
      if (identityRaw.publicKeyEd > peer.publicKeyHex) return;

      console.log("🔍 Dialing peer:", peer);

      try {
        const session = await connectToPeer(peer.ip, peer.tcpPort, identity);
        peerSessions.set(peer.publicKeyHex, session);
      } catch (err) {
        console.error("❌ Failed to connect:", (err as Error).message);
      }
    }
  );

  /* =========================
     SINGLE STDIN HANDLER
  ========================= */
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (line) => {
    if (!line.trim()) return;
    for (const session of peerSessions.values()) {
      session.sendMessage(line);
    }
  });

  /* =========================
     CLEAN EXIT
  ========================= */
  process.on("SIGINT", () => {
    stopDiscovery();
    console.log("🛑 Exiting...");
    process.exit(0);
  });
}

main();
