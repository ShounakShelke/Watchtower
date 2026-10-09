import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { encrypt, decrypt } from "../lib/crypto";

describe("Crypto Utility (AES-256-GCM)", () => {
  it("should encrypt and decrypt a plaintext string correctly", () => {
    const original = "my-secret-google-oauth-refresh-token-12345";
    const encrypted = encrypt(original);
    assert.notEqual(encrypted, original);
    assert.equal(encrypted.split(":").length, 3);

    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, original);
  });

  it("should return empty string for empty inputs", () => {
    assert.equal(encrypt(""), "");
    assert.equal(decrypt(""), "");
  });

  it("should fail gracefully on corrupted payload", () => {
    assert.throws(() => decrypt("invalid:format"));
  });
});

