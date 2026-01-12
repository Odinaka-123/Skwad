import sodium from "libsodium-wrappers-sumo";
import crypto from "crypto";

export async function createSkwad() {
  await sodium.ready;

  return {
    skwadId: crypto.randomBytes(16).toString("hex"),
    skwadSecret: crypto.randomBytes(32).toString("hex")
  };
}

export async function encryptMessage(message: string, keyHex: string) {
  await sodium.ready;
  const key = Buffer.from(keyHex, "hex");
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES);

  const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
    Buffer.from(message),
    null,
    null,
    nonce,
    key
  );

  return {
    nonce: Buffer.from(nonce).toString("hex"),
    ciphertext: Buffer.from(ciphertext).toString("hex")
  };
}

export async function decryptMessage(ciphertextHex: string, nonceHex: string, keyHex: string) {
  await sodium.ready;
  const key = Buffer.from(keyHex, "hex");

  const plaintext = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
    null,
    Buffer.from(ciphertextHex, "hex"),
    null,
    Buffer.from(nonceHex, "hex"),
    key
  );

  return Buffer.from(plaintext).toString();
}
