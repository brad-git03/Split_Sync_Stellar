/**
 * Validates a Stellar public G-address.
 */
export function validateStellarAddress(addr: string): boolean {
  if (!addr) return false;
  return /^G[A-Z2-7]{55}$/.test(addr.trim());
}

/**
 * Validates a Stellar contract address (starting with C or G).
 */
export function validateContractAddress(addr: string): boolean {
  if (!addr) return false;
  return /^[GC][A-Z2-7]{55}$/.test(addr.trim());
}
