import net from "net";
import sodium from "libsodium-wrappers-sumo";
import { SecureFrame } from "../../core/protocol/frame.js";
import { createClientSession } from "../../core/protocol/session.js";
import {
  ed25519PkToCurve25519,
  ed25519SkToCurve25519,
} from "../../core/crypto/convert.js";

export type PeerSession = {
  sendMessage: (text: string) => void;
  close: () => void;
};

export async function connectToPeer(
  ip: string,
  port: number,
  myKeys: { publicKeyEd: Uint8Array; privateKeyEd: Uint8Array },
  retryCount = 0
): Promise<PeerSession> {
  await sodium.ready;

  return new Promise((resolve, reject) => {
    const socket = net.connect(port, ip);
    let secure: SecureFrame | null = null;
    let handshakeDone = false;

    socket.once("connect", () => {
      socket.write(
        JSON.stringify({
          type: "HELLO",
          publicKeyHex: Buffer.from(myKeys.publicKeyEd).toString("hex"),
        })
      );
    });

    socket.on("data", async (data) => {
      try {
        if (!handshakeDone) {
          const ack = JSON.parse(data.toString());
          handshakeDone = true;

          const serverPublicEd = Uint8Array.from(
            Buffer.from(ack.publicKeyHex, "hex")
          );

          const keys = await createClientSession(
            ed25519PkToCurve25519(myKeys.publicKeyEd),
            ed25519SkToCurve25519(myKeys.privateKeyEd),
            ed25519PkToCurve25519(serverPublicEd)
          );

          secure = new SecureFrame(keys.sendKey, keys.receiveKey);

          console.log("🔐 Secure session established (client)");

          resolve({
            sendMessage(text: string) {
              socket.write(
                secure!.encrypt(Buffer.from(text, "utf-8"))
              );
            },
            close() {
              socket.end();
            },
          });

          return;
        }

        const plaintext = secure!.decrypt(data);
        console.log(
          "💬 Peer:",
          Buffer.from(plaintext).toString("utf-8")
        );
      } catch (err) {
        console.error("❌ Client error:", (err as Error).message);
      }
    });

    socket.on("error", (err) => {
      console.error("❌ Client socket error:", err.message);

      if (retryCount < 3) {
        setTimeout(() => {
          connectToPeer(ip, port, myKeys, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, 1000);
      } else {
        reject(err);
      }
    });
  });
}
