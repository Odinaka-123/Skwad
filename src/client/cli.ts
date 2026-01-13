import { loadOrCreateIdentity, deviceCode } from "../core/crypto/identity.js";
import { createSkwad, createSkwadSession } from "../core/protocol/skwad.js";
import { addPeer, listPeers } from "../core/crypto/peers.js";
import {
  createPairingRequest,
  acceptPairingRequest,
  finalizePairing,
} from "../core/protocol/pairing.js";
import sodium from "libsodium-wrappers-sumo";
import { startLanDiscovery, DISCOVERY_PORT } from "../core/discovery/lan.js";

async function main() {
  await sodium.ready;

  const identity = await loadOrCreateIdentity();
  console.log("Your Device Code:", deviceCode(identity.publicKey));

  const skwad = await createSkwad();
  console.log("Created Skwad ID:", skwad.skwadId);

  // ===== Secure session test (DIRECTIONAL) =====
  const sessionA = await createSkwadSession(skwad.skwadSecret, "initiator");
  const sessionB = await createSkwadSession(skwad.skwadSecret, "responder");

  const wire = sessionA.send("Hello Skwad 👋");
  const receivedBuffer = sessionB.receive(wire);

  let received: string;
  if (typeof receivedBuffer === "string") {
    received = receivedBuffer;
  } else {
    received = new TextDecoder().decode(receivedBuffer as Uint8Array);
  }
  console.log("Session decrypted:", received);

  // ===== Peer logic =====
  const fakeKey = "a1b2c3d4e5f6".repeat(5);
  try {
    const peer = addPeer(fakeKey);
    console.log("Added peer:", peer);
  } catch {
    console.log("Peer already trusted (skipping)");
  }
  console.log("Trusted peers:", listPeers());

  // ===== Pairing =====
  const req = await createPairingRequest(identity.publicKey);
  const res = await acceptPairingRequest(req, identity.publicKey);
  await finalizePairing(res);
  console.log("Pairing complete");

  // ===== LAN Discovery =====
  const discoveredPeers = new Set<string>();
  const stopDiscovery = startLanDiscovery(
    {
      skwadId: skwad.skwadId,
      deviceCode: deviceCode(identity.publicKey),
      publicKeyHex: Buffer.from(identity.publicKey).toString("hex"),
      port: DISCOVERY_PORT,
    },
    (peer) => {
      if (discoveredPeers.has(peer.skwadId)) return; // ignore duplicates
      discoveredPeers.add(peer.skwadId);

      console.log("🔍 LAN peer discovered:", {
        ip: peer.ip,
        skwadId: peer.skwadId,
        deviceCode: peer.deviceCode,
      });
    }
  );

  // Stop discovery cleanly on exit
  process.on("SIGINT", () => {
    stopDiscovery();
    process.exit();
  });
}

main();
