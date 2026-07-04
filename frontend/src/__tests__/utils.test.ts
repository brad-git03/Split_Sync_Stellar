import { formatTokenAmount } from "../utils/format";

describe("formatTokenAmount utility helper", () => {
  test("formats raw base unit values (Stroops) with 7 decimal places correctly", () => {
    expect(formatTokenAmount("22626149800")).toBe("2,262.61498");
    expect(formatTokenAmount("10000000000")).toBe("1,000");
    expect(formatTokenAmount("10000000")).toBe("1");
    expect(formatTokenAmount("5000000")).toBe("0.5");
    expect(formatTokenAmount("12345")).toBe("0.0012345");
  });

  test("handles zero and empty values gracefully", () => {
    expect(formatTokenAmount("0")).toBe("0");
    expect(formatTokenAmount("")).toBe("0");
  });

  test("leaves fallback messages like No Trustline untouched", () => {
    expect(formatTokenAmount("0 (No Trustline)")).toBe("0 (No Trustline)");
  });
});
