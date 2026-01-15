import net from "net";
import readline from "readline";
import sodium from "libsodium-wrappers-sumo";
import { SecureFrame } from "../../core/protocol/frame.js";
import { createClientSession } from "../../core/protocol/session.js";

export async function connectToPeer(
  ip: string,
  port: number,
  myKeys: { publicKey: Uint8Array; privateKey: Uint8Array },
  retryCount = 0
) {
  await sodium.ready;

  const socket = net.connect(port, ip);
  let secure: SecureFrame;

  socket.on("error", (err: any) => {
    console.error(`❌ Connection error to ${ip}:${port} →`, err.message);
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
        publicKeyHex: Buffer.from(myKeys.publicKey).toString("hex"),
      })
    );
  });

  socket.once("data", async (data) => {
    try {
      const ack = JSON.parse(data.toString());
      const serverPublicKey = Uint8Array.from(Buffer.from(ack.publicKeyHex, "hex"));

      const keys = await createClientSession(myKeys.publicKey, myKeys.privateKey, serverPublicKey);

      secure = new SecureFrame(keys.sendKey, keys.receiveKey);

      console.log("🔐 Secure session established (client)");
      console.log("💬 Start chatting");

      socket.on("data", (chunk) => {
        try {
          const msg = secure.decrypt(chunk);
          console.log("💬 Peer:", msg.toString());
        } catch (err: any) {
          console.warn("⚠️ Failed to decrypt message:", err.message);
        }
      });

      socket.on("close", () => console.log(`🛑 Connection to ${ip}:${port} closed`));
    } catch (err: any) {
      console.error("❌ Handshake failed:", err.message);
      socket.destroy();
    }
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("line", (line) => {
    if (!secure) return;
    try {
      socket.write(secure.encrypt(Buffer.from(line)));
    } catch (err: any) {
      console.warn("⚠️ Failed to send message:", err.message);
    }
  });
}
