/**
 * Formats a raw token amount in base units (7 decimal places) into a user-friendly decimal string.
 */
export function formatTokenAmount(amountStr: string): string {
  if (!amountStr) return "0";
  if (amountStr.includes("No Trustline")) {
    return amountStr;
  }
  try {
    const val = BigInt(amountStr);
    const decimals = 7;
    const factor = BigInt(10 ** decimals);
    const integerPart = val / factor;
    const fractionalPart = val % factor;

    let fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    // Trim trailing zeros in fractional part to keep it clean
    fractionalStr = fractionalStr.replace(/0+$/, "");

    // Format integer part with commas (locale-aware)
    const formattedInteger = integerPart.toLocaleString("en-US");

    if (fractionalStr.length > 0) {
      return `${formattedInteger}.${fractionalStr}`;
    }
    return formattedInteger;
  } catch (err) {
    return amountStr;
  }
}
