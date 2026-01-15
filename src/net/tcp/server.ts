import net from "net";
import readline from "readline";
import sodium from "libsodium-wrappers-sumo";
import { SecureFrame } from "../../core/protocol/frame.js";
import { createServerSession } from "../../core/protocol/session.js";
import {
  ed25519PkToCurve25519,
  ed25519SkToCurve25519,
} from "../../core/crypto/convert.js";

export function startTcpServer(
  port: number,
  myKeys: { publicKeyEd: Uint8Array; privateKeyEd: Uint8Array }
) {
  const server = net.createServer(async (socket) => {
    await sodium.ready;

    socket.once("data", async (data) => {
      try {
        const hello = JSON.parse(data.toString());

        const peerPublicEd = Uint8Array.from(
          Buffer.from(hello.publicKeyHex, "hex")
        );

        const keys = await createServerSession(
          ed25519PkToCurve25519(myKeys.publicKeyEd),
          ed25519SkToCurve25519(myKeys.privateKeyEd),
          ed25519PkToCurve25519(peerPublicEd)
        );

        const secure = new SecureFrame(keys.sendKey, keys.receiveKey);

        socket.write(
          JSON.stringify({
            type: "HELLO_ACK",
            publicKeyHex: Buffer.from(myKeys.publicKeyEd).toString("hex"),
          })
        );

        console.log("🔐 Secure session established (server)");

        socket.on("data", (chunk) => {
          const plaintext = secure.decrypt(chunk);
          console.log(
            "💬 Peer:",
            Buffer.from(plaintext).toString("utf-8")
          );
        });

        // ⚠️ DO NOT create multiple readline instances per peer
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.on("line", (line) => {
          socket.write(
            secure.encrypt(Buffer.from(line, "utf-8"))
          );
        });
      } catch (err) {
        console.error("❌ Server error:", (err as Error).message);
        socket.destroy();
      }
    });
  });

  server.listen(port, () =>
    console.log(`🔒 TCP server listening on ${port}`)
  );
}
