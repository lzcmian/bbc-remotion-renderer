# BBC bilingual Remotion renderer

This public repository is a deterministic render worker for sentence-level bilingual captions. It contains the Remotion presentation layer and final publishable captions only.

It deliberately excludes ASR output, word-level timestamps, semantic transcripts, prompts, reconciliation notes, review records, API credentials, source audio, and the private subtitle-production workflow.

## Public episode format

Each `episodes/<episode-id>/captions.json` contains only:

```json
{
  "metadata": {
    "brand": "BBC WORLD SERVICE",
    "title": "Global News Podcast",
    "episode": "Episode label"
  },
  "durationMs": 1000,
  "notices": [],
  "cues": [
    {
      "id": 1,
      "startMs": 0,
      "endMs": 1000,
      "en": "English sentence.",
      "zh": "中文翻译。"
    }
  ]
}
```

The validation script rejects extra cue fields so internal trace data cannot be published accidentally.

## Distributed rendering

The `Distributed render` workflow:

1. validates the selected public caption file;
2. divides its 30 fps frame range into up to 16 shards;
3. renders silent H.264 shards on standard GitHub-hosted Linux runners;
4. concatenates the shards without re-encoding;
5. fetches and cuts the audio from repository secrets, then muxes it once;
6. uploads the final MP4 for one day and deletes intermediate artifacts.

The repository contains no audio URLs or editorial cut ranges. Repository maintainers configure these as Actions secrets.

## Local checks

```shell
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run verify:episode -- episodes/p0p32jtr/captions.json
```

This project is not affiliated with or endorsed by the BBC. BBC names and programme material remain the property of their respective owners.

The MIT license applies to the original renderer and automation code only. It does not license episode captions or third-party programme material.
