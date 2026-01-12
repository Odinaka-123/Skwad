import sodium from "libsodium-wrappers-sumo";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// ESM-safe __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File path for device identity
const IDENTITY_FILE = path.join(__dirname, "device_identity.json");

export async function loadOrCreateIdentity() {
  // Wait for libsodium to be ready
  await sodium.ready;

  // Load identity if it exists
  if (fs.existsSync(IDENTITY_FILE)) {
    return JSON.parse(fs.readFileSync(IDENTITY_FILE, "utf8"));
  }

  // Create new keypair
  const keypair = sodium.crypto_sign_keypair();

  const identity = {
    publicKey: Buffer.from(keypair.publicKey).toString("hex"),
    privateKey: Buffer.from(keypair.privateKey).toString("hex")
  };

  fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2));
  return identity;
}

export function deviceCode(publicKeyHex: string) {
  return `SK-${publicKeyHex.slice(0, 4).toUpperCase()}-${publicKeyHex.slice(4, 8).toUpperCase()}`;
}
