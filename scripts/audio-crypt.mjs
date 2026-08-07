import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";

const MAGIC = Buffer.from("BBCRENDER1", "ascii");
const IV_BYTES = 12;
const TAG_BYTES = 16;

const [mode, input, output] = process.argv.slice(2);
if (!mode || !input || !output || !["encrypt", "decrypt"].includes(mode)) {
  throw new Error("Usage: node scripts/audio-crypt.mjs <encrypt|decrypt> <input> <output>");
}

const keyHex = process.env.AUDIO_KEY ?? "";
if (!/^[0-9a-f]{64}$/i.test(keyHex)) {
  throw new Error("AUDIO_KEY must contain exactly 64 hexadecimal characters");
}
const key = Buffer.from(keyHex, "hex");

if (mode === "encrypt") {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(readFileSync(input)),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  writeFileSync(output, Buffer.concat([MAGIC, iv, tag, ciphertext]));
} else {
  const payload = readFileSync(input);
  const magic = payload.subarray(0, MAGIC.length);
  if (!magic.equals(MAGIC)) {
    throw new Error("Encrypted audio has an invalid header");
  }
  const ivStart = MAGIC.length;
  const tagStart = ivStart + IV_BYTES;
  const ciphertextStart = tagStart + TAG_BYTES;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    payload.subarray(ivStart, tagStart),
  );
  decipher.setAuthTag(payload.subarray(tagStart, ciphertextStart));
  const plaintext = Buffer.concat([
    decipher.update(payload.subarray(ciphertextStart)),
    decipher.final(),
  ]);
  writeFileSync(output, plaintext);
}
