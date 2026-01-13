import sodium from "libsodium-wrappers-sumo";
import crypto from "crypto";
import { SecureFrame } from "./frame.js";

/**
 * Create a new Skwad identity
 */
export async function createSkwad() {
  await sodium.ready;

  return {
    skwadId: crypto.randomBytes(16).toString("hex"),
    skwadSecret: crypto.randomBytes(32), // raw bytes
  };
}

/**
 * Deterministically derive directional session keys
 * (temporary — will be replaced by crypto_kx)
 */
function deriveSessionKeys(secret: Uint8Array) {
  const hash = crypto.createHash("sha512").update(secret).digest();

  return {
    sendA: hash.subarray(0, 32),
    sendB: hash.subarray(32, 64),
  };
}

/**
 * Stateful encrypted Skwad session
 */
export class SkwadSession {
  private frame: SecureFrame;

  constructor(sendKey: Uint8Array, receiveKey: Uint8Array) {
    this.frame = new SecureFrame(sendKey, receiveKey);
  }

  send(message: string): Uint8Array {
    const bytes = new TextEncoder().encode(message);
    return this.frame.encrypt(bytes);
  }

  receive(packet: Uint8Array): string {
    const bytes = this.frame.decrypt(packet);
    return new TextDecoder().decode(bytes);
  }
}

/**
 * Create a directional session
 */
export async function createSkwadSession(
  secret: Uint8Array,
  role: "initiator" | "responder"
) {
  await sodium.ready;

  const { sendA, sendB } = deriveSessionKeys(secret);

  return role === "initiator"
    ? new SkwadSession(sendA, sendB)
    : new SkwadSession(sendB, sendA);
}

/**
 * Legacy APIs (hard disabled)
 */
export async function encryptMessage(): Promise<never> {
  throw new Error("encryptMessage is deprecated. Use SkwadSession.send()");
}

export async function decryptMessage(): Promise<never> {
  throw new Error("decryptMessage is deprecated. Use SkwadSession.receive()");
}
