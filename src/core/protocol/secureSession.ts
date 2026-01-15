import sodium from "libsodium-wrappers-sumo";
import {
  ed25519PkToCurve25519,
  ed25519SkToCurve25519,
} from "../crypto/convert.js";

/**
 * SERVER SIDE
 */
export async function createServerSession(
  myPublicEd: Uint8Array,
  myPrivateEd: Uint8Array,
  peerPublicEd: Uint8Array
) {
  await sodium.ready;

  const myPk = ed25519PkToCurve25519(myPublicEd);
  const mySk = ed25519SkToCurve25519(myPrivateEd);
  const peerPk = ed25519PkToCurve25519(peerPublicEd);

  const { sharedRx, sharedTx } =
    sodium.crypto_kx_server_session_keys(
      myPk,
      mySk,
      peerPk
    );

  return {
    sendKey: sharedTx,
    receiveKey: sharedRx,
  };
}

/**
 * CLIENT SIDE
 */
export async function createClientSession(
  myPublicEd: Uint8Array,
  myPrivateEd: Uint8Array,
  serverPublicEd: Uint8Array
) {
  await sodium.ready;

  const myPk = ed25519PkToCurve25519(myPublicEd);
  const mySk = ed25519SkToCurve25519(myPrivateEd);
  const serverPk = ed25519PkToCurve25519(serverPublicEd);

  const { sharedRx, sharedTx } =
    sodium.crypto_kx_client_session_keys(
      myPk,
      mySk,
      serverPk
    );

  return {
    sendKey: sharedTx,
    receiveKey: sharedRx,
  };
}
