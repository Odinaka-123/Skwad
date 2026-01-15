import sodium from "libsodium-wrappers-sumo";

export function ed25519PkToCurve25519(
  edPk: Uint8Array
): Uint8Array {
  return (sodium as any).crypto_sign_ed25519_pk_to_curve25519(edPk);
}

export function ed25519SkToCurve25519(
  edSk: Uint8Array
): Uint8Array {
  return (sodium as any).crypto_sign_ed25519_sk_to_curve25519(edSk);
}
