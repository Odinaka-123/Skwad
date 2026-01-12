import { loadOrCreateIdentity, deviceCode } from "../crypto/identity.js";
import { createSkwad, encryptMessage, decryptMessage } from "../protocol/skwad.js";


async function main() {
  const identity = await loadOrCreateIdentity();
  console.log("Your Device Code:", deviceCode(identity.publicKey));

  const skwad = await createSkwad();
  console.log("Created Skwad ID:", skwad.skwadId);

  const encrypted = await encryptMessage("Hello Skwad 👋", skwad.skwadSecret);
  console.log("Encrypted:", encrypted);

  const decrypted = await decryptMessage(encrypted.ciphertext, encrypted.nonce, skwad.skwadSecret);
  console.log("Decrypted:", decrypted);
}

main();
