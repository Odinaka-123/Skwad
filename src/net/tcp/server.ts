import net from "net";
import readline from "readline";
import sodium from "libsodium-wrappers-sumo";
import { SecureFrame } from "../../core/protocol/frame.js";
import { createServerSession } from "../../core/protocol/session.js";

export function startTcpServer(
  port: number,
  myKeys: { publicKey: Uint8Array; privateKey: Uint8Array }
) {
  const server = net.createServer(async (socket) => {
    await sodium.ready;

    socket.once("data", async (data) => {
      const hello = JSON.parse(data.toString());
      const peerPublicKey = Uint8Array.from(Buffer.from(hello.publicKeyHex, "hex"));

      const keys = await createServerSession(myKeys.publicKey, myKeys.privateKey, peerPublicKey);

      const secure = new SecureFrame(keys.sendKey, keys.receiveKey);

      socket.write(
        JSON.stringify({
          type: "HELLO_ACK",
          publicKeyHex: Buffer.from(myKeys.publicKey).toString("hex"),
        })
      );

      socket.on("error", (err) => console.error("❌ Socket error:", err.message));

      console.log("🔐 Secure session established (server)");

      socket.on("data", (chunk) => {
        const plaintext = secure.decrypt(chunk);
        console.log("💬 Peer:", plaintext.toString());
      });

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.on("line", (line) => {
        const encrypted = secure.encrypt(Buffer.from(line));
        socket.write(encrypted);
      });
    });
  });

  server.listen(port, () => console.log(`🔒 TCP server listening on ${port}`));
}
