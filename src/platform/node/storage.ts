import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const IDENTITY_FILE = path.join(__dirname, "device_identity.json");

// Node-specific storage functions
export function exists(file: string) {
  return fs.existsSync(file);
}

export function read(file: string) {
  return fs.readFileSync(file, "utf8");
}

export function write(file: string, data: string) {
  fs.writeFileSync(file, data);
}
