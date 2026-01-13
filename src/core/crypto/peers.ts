import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), ".skwad");
const PEERS_FILE = path.join(DATA_DIR, "peers.json");

export interface TrustedPeer {
  id: string;          
  publicKeyHex: string;
  addedAt: number;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function fingerprint(publicKeyHex: string): string {
  return crypto
    .createHash("sha256")
    .update(publicKeyHex)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}

export function loadPeers(): TrustedPeer[] {
  ensureDataDir();

  if (!fs.existsSync(PEERS_FILE)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(PEERS_FILE, "utf8"));
}

export function savePeers(peers: TrustedPeer[]) {
  ensureDataDir();
  fs.writeFileSync(PEERS_FILE, JSON.stringify(peers, null, 2));
}

export function addPeer(publicKeyHex: string): TrustedPeer {
  const peers = loadPeers();
  const id = fingerprint(publicKeyHex);

  const existing = peers.find(p => p.id === id);
  if (existing) {
    return existing;
  }

  const peer: TrustedPeer = {
    id,
    publicKeyHex,
    addedAt: Date.now()
  };

  peers.push(peer);
  savePeers(peers);

  return peer;
}


export function listPeers(): TrustedPeer[] {
  return loadPeers();
}
