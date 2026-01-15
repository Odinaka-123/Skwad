import net from "net";
import readline from "readline";
import sodium from "libsodium-wrappers-sumo";
import { SecureFrame } from "../../core/protocol/frame.js";
import { createServerSession } from "../../core/protocol/session.js";
import { ed25519PkToCurve25519, ed25519SkToCurve25519 } from "../../core/crypto/convert.js";

export function startTcpServer(
  port: number,
  myKeys: { publicKeyEd: Uint8Array; privateKeyEd: Uint8Array }
) {
  const server = net.createServer(async (socket) => {
    await sodium.ready;

    socket.once("data", async (data) => {
      const hello = JSON.parse(data.toString());

      const peerPublicEd = Uint8Array.from(Buffer.from(hello.publicKeyHex, "hex"));

      // ✅ Convert to X25519 at runtime
      const myPublicX = ed25519PkToCurve25519(myKeys.publicKeyEd);
      const mySecretX = ed25519SkToCurve25519(myKeys.privateKeyEd);
      const peerPublicX = ed25519PkToCurve25519(peerPublicEd);

      const keys = await createServerSession(myPublicX, mySecretX, peerPublicX);
      const secure = new SecureFrame(keys.sendKey, keys.receiveKey);

      socket.write(
        JSON.stringify({
          type: "HELLO_ACK",
          publicKeyHex: Buffer.from(myKeys.publicKeyEd).toString("hex"),
        })
      );

      socket.on("error", (err: unknown) => {
        console.error("❌ Socket error:", (err as Error).message);
      });

      console.log("🔐 Secure session established (server)");

      socket.on("data", (chunk) => {
        const plaintext = secure.decrypt(chunk);
        console.log("💬 Peer:", plaintext.toString());
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on("line", (line) => {
        const encrypted = secure.encrypt(Buffer.from(line));
        socket.write(encrypted);
      });
    });
  });

  server.listen(port, () => console.log(`🔒 TCP server listening on ${port}`));
}
