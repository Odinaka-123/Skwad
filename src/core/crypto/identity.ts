import sodium from "libsodium-wrappers-sumo";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { ed25519PkToCurve25519, ed25519SkToCurve25519 } from "./convert.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Identity file path
function identityFile(profile: string) {
  return path.join(__dirname, `device_identity_${profile}.json`);
}

export interface Identity {
  publicKeyEd: string; // hex
  privateKeyEd: string; // hex
  publicKeyX: string; // hex
  privateKeyX: string; // hex
  createdAt: number;
  profile: string;
}

// Load or create identity
export async function loadOrCreateIdentity(profile = "default"): Promise<Identity> {
  await sodium.ready;

  const FILE = identityFile(profile);

  if (fs.existsSync(FILE)) {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  }

  const keypair = sodium.crypto_sign_keypair();

  const pubX = ed25519PkToCurve25519(keypair.publicKey);
  const skX = ed25519SkToCurve25519(keypair.privateKey);

  const identity: Identity = {
    publicKeyEd: Buffer.from(keypair.publicKey).toString("hex"),
    privateKeyEd: Buffer.from(keypair.privateKey).toString("hex"),
    publicKeyX: Buffer.from(pubX).toString("hex"),
    privateKeyX: Buffer.from(skX).toString("hex"),
    createdAt: Date.now(),
    profile,
  };

  fs.writeFileSync(FILE, JSON.stringify(identity, null, 2));
  return identity;
}

export function deviceCode(publicKeyHex: string) {
  return `SK-${publicKeyHex.slice(0, 4).toUpperCase()}-${publicKeyHex.slice(-4).toUpperCase()}`;
}
