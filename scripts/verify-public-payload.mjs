import {readFileSync} from "node:fs";

const file = process.argv[2];
if (!file) {
  throw new Error("Usage: node scripts/verify-public-payload.mjs <captions.json>");
}

const payload = JSON.parse(readFileSync(file, "utf8"));
const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields ${actual.join(", ")} do not match ${wanted.join(", ")}`);
  }
};

exactKeys(payload, ["metadata", "durationMs", "notices", "cues"], "payload");
exactKeys(payload.metadata, ["brand", "title", "episode"], "metadata");
if (!Number.isFinite(payload.durationMs) || payload.durationMs <= 0) {
  throw new Error("durationMs must be a positive number");
}
if (!Array.isArray(payload.notices) || !Array.isArray(payload.cues)) {
  throw new Error("notices and cues must be arrays");
}

for (const [index, notice] of payload.notices.entries()) {
  exactKeys(notice, ["startMs", "endMs", "text"], `notice ${index + 1}`);
}
for (const [index, cue] of payload.cues.entries()) {
  exactKeys(cue, ["id", "startMs", "endMs", "en", "zh"], `cue ${index + 1}`);
  if (cue.id !== index + 1) {
    throw new Error(`cue ${index + 1} has non-contiguous id ${cue.id}`);
  }
  if (!Number.isFinite(cue.startMs) || !Number.isFinite(cue.endMs) || cue.endMs < cue.startMs) {
    throw new Error(`cue ${cue.id} has invalid timing`);
  }
  if (typeof cue.en !== "string" || typeof cue.zh !== "string") {
    throw new Error(`cue ${cue.id} must contain en and zh strings`);
  }
}

console.log(`Verified ${payload.cues.length} public sentence cues in ${file}`);
