import React from "react";
import {Composition} from "remotion";
import episodeData from "../public/episode.json";
import {BBCBilingualVideo} from "./BBCBilingualVideo";
import type {CaptionData} from "./types";

const FPS = 30;
const data = episodeData as CaptionData;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BBCBilingual"
      component={BBCBilingualVideo}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={Math.ceil((data.durationMs / 1000) * FPS)}
      defaultProps={{data, clipStartMs: 0}}
    />
  );
};
