import sodium from "libsodium-wrappers-sumo";

/**
 * SERVER SIDE
 */
export async function createServerSession(
  myPublicX: Uint8Array,
  mySecretX: Uint8Array,
  peerPublicX: Uint8Array
) {
  await sodium.ready;

  const { sharedRx, sharedTx } = sodium.crypto_kx_server_session_keys(
    myPublicX,
    mySecretX,
    peerPublicX
  );

  return { sendKey: sharedTx, receiveKey: sharedRx };
}

/**
 * CLIENT SIDE
 */
export async function createClientSession(
  myPublicX: Uint8Array,
  mySecretX: Uint8Array,
  serverPublicX: Uint8Array
) {
  await sodium.ready;

  const { sharedRx, sharedTx } = sodium.crypto_kx_client_session_keys(
    myPublicX,
    mySecretX,
    serverPublicX
  );

  return { sendKey: sharedTx, receiveKey: sharedRx };
}
