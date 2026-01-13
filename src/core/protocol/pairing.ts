import sodium from "libsodium-wrappers-sumo";
import { addPeer } from "../crypto/peers.js";

export interface PairingRequest {
  publicKeyHex: string;
}

export interface PairingResponse {
  publicKeyHex: string;
}

export async function createPairingRequest(
  publicKey: Uint8Array
): Promise<PairingRequest> {
  await sodium.ready;

  return {
    publicKeyHex: Buffer.from(publicKey).toString("hex"),
  };
}

export async function acceptPairingRequest(
  request: PairingRequest,
  myPublicKey: Uint8Array
): Promise<PairingResponse> {
  await sodium.ready;

  addPeer(request.publicKeyHex);

  return {
    publicKeyHex: Buffer.from(myPublicKey).toString("hex"),
  };
}

export async function finalizePairing(response: PairingResponse) {
  await sodium.ready;

  addPeer(response.publicKeyHex);
}
