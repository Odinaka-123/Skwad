import net from "net";
import readline from "readline";
import sodium from "libsodium-wrappers-sumo";
import { SecureFrame } from "../../core/protocol/frame.js";
import { createClientSession } from "../../core/protocol/session.js";
import { ed25519PkToCurve25519, ed25519SkToCurve25519 } from "../../core/crypto/convert.js";

/**
 * Connects to a peer safely over TCP
 */
export async function connectToPeer(
  ip: string,
  port: number,
  myKeys: { publicKeyEd: Uint8Array; privateKeyEd: Uint8Array },
  retryCount = 0
) {
  await sodium.ready;

  const socket = net.connect(port, ip);
  let secure: SecureFrame;

  socket.on("error", (err: unknown) => {
    console.error(`❌ Connection error to ${ip}:${port} →`, (err as Error).message);
    socket.destroy();

    if (retryCount < 3) {
      console.log(`⏳ Retrying connection to ${ip}:${port} in 1s...`);
      setTimeout(() => connectToPeer(ip, port, myKeys, retryCount + 1), 1000);
    }
  });

  socket.once("connect", () => {
    socket.write(
      JSON.stringify({
        type: "HELLO",
        publicKeyHex: Buffer.from(myKeys.publicKeyEd).toString("hex"),
      })
    );
  });

  socket.once("data", async (data) => {
    try {
      const ack = JSON.parse(data.toString());
      const serverPublicEd = Uint8Array.from(Buffer.from(ack.publicKeyHex, "hex"));

      // ✅ Convert to X25519 at runtime
      const myPublicX = ed25519PkToCurve25519(myKeys.publicKeyEd);
      const mySecretX = ed25519SkToCurve25519(myKeys.privateKeyEd);
      const serverPublicX = ed25519PkToCurve25519(serverPublicEd);

      const keys = await createClientSession(myPublicX, mySecretX, serverPublicX);
      secure = new SecureFrame(keys.sendKey, keys.receiveKey);

      console.log("🔐 Secure session established (client)");
      console.log("💬 Start chatting");

      socket.on("data", (chunk) => {
        try {
          const msg = secure.decrypt(chunk);
          console.log("💬 Peer:", msg.toString());
        } catch (err) {
          console.warn("⚠️ Failed to decrypt message:", (err as Error).message);
        }
      });

      socket.on("close", () => {
        console.log(`🛑 Connection to ${ip}:${port} closed`);
      });
    } catch (err) {
      console.error("❌ Handshake failed:", (err as Error).message);
      socket.destroy();
    }
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (line) => {
    if (!secure) return;
    try {
      socket.write(secure.encrypt(Buffer.from(line)));
    } catch (err) {
      console.warn("⚠️ Failed to send message:", (err as Error).message);
    }
  });
}
