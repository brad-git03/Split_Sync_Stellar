import { validateStellarAddress, validateContractAddress } from "../utils/validation";

describe("Stellar Address Validators", () => {
  describe("validateStellarAddress", () => {
    test("returns true for valid public key G-addresses", () => {
      expect(
        validateStellarAddress("GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE")
      ).toBe(true);
    });

    test("trims leading/trailing spaces and returns true", () => {
      expect(
        validateStellarAddress("  GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE  ")
      ).toBe(true);
    });

    test("returns false for contract C-addresses", () => {
      expect(
        validateStellarAddress("CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA")
      ).toBe(false);
    });

    test("returns false for invalid inputs", () => {
      expect(validateStellarAddress("")).toBe(false);
      expect(validateStellarAddress("G123")).toBe(false);
      expect(validateStellarAddress("InvalidString")).toBe(false);
    });
  });

  describe("validateContractAddress", () => {
    test("returns true for valid contract C-addresses", () => {
      expect(
        validateContractAddress("CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA")
      ).toBe(true);
    });

    test("returns true for valid public key G-addresses", () => {
      expect(
        validateContractAddress("GCCY5TQ262GIYZDRRYENCSWUJXT3THBQQ42RINCESXTYZMGTL2NJM4SE")
      ).toBe(true);
    });

    test("returns false for malformed or short addresses", () => {
      expect(validateContractAddress("C123")).toBe(false);
      expect(validateContractAddress("")).toBe(false);
    });
  });
});
