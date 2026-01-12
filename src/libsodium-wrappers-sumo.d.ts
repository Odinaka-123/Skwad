declare module "libsodium-wrappers-sumo" {
  interface Sodium {
    ready: Promise<void>;

    crypto_sign_keypair(): {
      publicKey: Uint8Array;
      privateKey: Uint8Array;
    };

    randombytes_buf(length: number): Uint8Array;

    crypto_aead_chacha20poly1305_ietf_NPUBBYTES: number;

    crypto_aead_chacha20poly1305_ietf_encrypt(
      message: Uint8Array,
      additionalData: Uint8Array | null,
      secretNonce: Uint8Array | null,
      nonce: Uint8Array,
      key: Uint8Array
    ): Uint8Array;

    crypto_aead_chacha20poly1305_ietf_decrypt(
      additionalData: Uint8Array | null,
      ciphertext: Uint8Array,
      secretNonce: Uint8Array | null,
      nonce: Uint8Array,
      key: Uint8Array
    ): Uint8Array;
  }

  const sodium: Sodium;
  export default sodium;
}
