import { useStellarWalletContext } from "@/context/StellarWalletContext";

export function useStellarWallet() {
  const context = useStellarWalletContext();

  // Truncate address to form e.g. GD2C...3K9W
  const truncatedAddress = context.address
    ? `${context.address.slice(0, 4)}...${context.address.slice(-4)}`
    : "";

  return {
    ...context,
    truncatedAddress,
  };
}
