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
      let hello: any;

      try {
        hello = JSON.parse(data.toString());
      } catch {
        console.log("📱 UI client connected (non-JSON hello)");
        setupPlaintextClient(socket);
        return;
      }

      // 🟡 UI CLIENT (Flutter)
      if (!hello.publicKeyHex || hello.publicKeyHex.length !== 64 * 2) {
        console.log("📱 UI client connected (plaintext)");
        setupPlaintextClient(socket);
        return;
      }

      // 🔐 SECURE PEER CLIENT
      try {
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

        console.log("🔐 Secure session established (peer)");

        socket.on("data", (chunk) => {
          const plaintext = secure.decrypt(chunk);
          console.log("💬 Peer:", Buffer.from(plaintext).toString("utf-8"));
        });

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.on("line", (line) => {
          socket.write(secure.encrypt(Buffer.from(line, "utf-8")));
        });
      } catch (err) {
        console.error("❌ Secure peer error:", (err as Error).message);
        socket.destroy();
      }
    });
  });

  server.listen(port, () =>
    console.log(`🔒 TCP server listening on ${port}`)
  );
}

// ----------------------------
// PLAINTEXT UI CLIENT HANDLER
// ----------------------------
function setupPlaintextClient(socket: net.Socket) {
  socket.on("data", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("📱 UI:", msg);
    } catch {
      // ignore
    }
  });

  socket.on("close", () => {
    console.log("📱 UI client disconnected");
  });
}
