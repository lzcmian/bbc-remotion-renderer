import {appendFileSync, readFileSync} from "node:fs";

const [file, requestedText] = process.argv.slice(2);
if (!file || !requestedText) {
  throw new Error("Usage: node scripts/plan-shards.mjs <captions.json> <shards>");
}

const payload = JSON.parse(readFileSync(file, "utf8"));
const totalFrames = Math.ceil((payload.durationMs / 1000) * 30);
const requested = Number.parseInt(requestedText, 10);
if (!Number.isInteger(requested) || requested < 1 || requested > 16) {
  throw new Error("shards must be an integer between 1 and 16");
}

const count = Math.min(requested, totalFrames);
const include = [];
for (let id = 0; id < count; id++) {
  const start = Math.floor((id * totalFrames) / count);
  const end = Math.floor(((id + 1) * totalFrames) / count) - 1;
  include.push({id, start, end});
}

const output = process.env.GITHUB_OUTPUT;
if (!output) {
  console.log(JSON.stringify({matrix: {include}, totalFrames}, null, 2));
} else {
  appendFileSync(output, `matrix=${JSON.stringify({include})}\n`);
  appendFileSync(output, `total_frames=${totalFrames}\n`);
}
