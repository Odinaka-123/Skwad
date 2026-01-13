import sodium from "libsodium-wrappers-sumo";

export interface SessionKeys {
  sendKey: Uint8Array;
  receiveKey: Uint8Array;
}
export async function createClientSession(
  myPublicKey: Uint8Array,
  myPrivateKey: Uint8Array,
  peerPublicKey: Uint8Array
): Promise<SessionKeys> {
  await sodium.ready;

  const { sharedTx, sharedRx } = sodium.crypto_kx_client_session_keys(
    myPublicKey,
    myPrivateKey,
    peerPublicKey
  );

  return {
    sendKey: sharedTx,
    receiveKey: sharedRx
  };
}

/**
 * Server-side session key derivation
 * (responder)
 */
export async function createServerSession(
  myPublicKey: Uint8Array,
  myPrivateKey: Uint8Array,
  peerPublicKey: Uint8Array
): Promise<SessionKeys> {
  await sodium.ready;

  const { sharedTx, sharedRx } = sodium.crypto_kx_server_session_keys(
    myPublicKey,
    myPrivateKey,
    peerPublicKey
  );

  return {
    sendKey: sharedRx,
    receiveKey: sharedTx
  };
}
