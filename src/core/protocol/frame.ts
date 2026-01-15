import sodium from "libsodium-wrappers-sumo";

export class SecureFrame {
  private sendCounter = 0n;
  private receiveCounter = 0n;

  constructor(
    private readonly sendKey: Uint8Array,
    private readonly receiveKey: Uint8Array
  ) {}

  /**
   * IETF ChaCha20-Poly1305 nonce
   * 96 bits total:
   * - first 4 bytes: zero
   * - last 8 bytes: message counter
   */
  private makeNonce(counter: bigint): Uint8Array {
    const nonce = new Uint8Array(
      sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES
    );

    const view = new DataView(nonce.buffer);
    view.setBigUint64(4, counter, false); // big-endian

    return nonce;
  }

  /* =========================
     ENCRYPT
  ========================= */
  encrypt(payload: Uint8Array): Uint8Array {
    const counter = this.sendCounter++;
    const nonce = this.makeNonce(counter);

    const ciphertext =
      sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
        payload,
        null,
        null,
        nonce,
        this.sendKey
      );

    // frame = [counter (8 bytes)] + ciphertext
    const frame = new Uint8Array(8 + ciphertext.length);
    const view = new DataView(frame.buffer);

    view.setBigUint64(0, counter, false);
    frame.set(ciphertext, 8);

    return frame;
  }

  /* =========================
     DECRYPT
  ========================= */
  decrypt(frame: Uint8Array): Uint8Array {
    const view = new DataView(frame.buffer);
    const counter = view.getBigUint64(0, false);

    if (counter !== this.receiveCounter) {
      throw new Error("Replay or out-of-order message detected");
    }

    const nonce = this.makeNonce(counter);
    this.receiveCounter++;

    const ciphertext = frame.slice(8);

    const plaintext =
      sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
        null,
        ciphertext,
        null,
        nonce,
        this.receiveKey
      );

    if (!plaintext) {
      throw new Error("Decryption failed");
    }

    return plaintext;
  }
}
