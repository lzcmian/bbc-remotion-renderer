import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {loadFont as loadInter} from "@remotion/google-fonts/Inter";
import {loadFont as loadSourceSerif4} from "@remotion/google-fonts/SourceSerif4";
import type {
  BilingualVideoProps,
  CaptionCue,
} from "./types";
import {theme} from "./theme";

const {fontFamily: interFamily} = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const {fontFamily: sourceSerifFamily} = loadSourceSerif4("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

const chineseFontFace = `
@font-face {
  font-family: "BBC Noto Serif SC";
  src: url("${staticFile("fonts/NotoSerifSC-VF.ttf")}") format("truetype");
  font-weight: 100 900;
  font-display: swap;
}
`;

const binarySearchActiveCue = (
  cues: CaptionCue[],
  timeMs: number,
): number => {
  let low = 0;
  let high = cues.length - 1;
  let answer = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (cues[middle].startMs <= timeMs) {
      answer = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return answer;
};

const chineseWordSegmenter = new Intl.Segmenter("zh-CN", {
  granularity: "word",
});

const closingPunctuation = /^[，。！？；：、）》】」』…—]+$/u;

const segmentChineseText = (text: string): string[] => {
  const segments: string[] = [];
  for (const item of chineseWordSegmenter.segment(text)) {
    if (closingPunctuation.test(item.segment) && segments.length > 0) {
      segments[segments.length - 1] += item.segment;
    } else {
      segments.push(item.segment);
    }
  }
  return segments;
};

const ChineseText: React.FC<{text: string}> = ({text}) => {
  return (
    <>
      {segmentChineseText(text).map((segment, index) => (
        <span
          key={`${segment}-${index}`}
          style={{display: "inline-block", whiteSpace: "nowrap"}}
        >
          {segment}
        </span>
      ))}
    </>
  );
};

const CurrentSentence: React.FC<{
  cue: CaptionCue;
  progress: number;
}> = ({cue, progress}) => {
  const y = interpolate(progress, [0, 1], [42, 0]);
  const englishSize =
    cue.en.length > 125
      ? 42
      : cue.en.length > 105
        ? 50
        : cue.en.length > 82
          ? 55
          : 60;
  return (
    <div
      style={{
        position: "absolute",
        left: 158,
        right: 158,
        top: 455,
        opacity: progress,
        transform: `translateY(${y}px)`,
        transformOrigin: "left center",
      }}
    >
      <div
        style={{
          fontFamily: sourceSerifFamily,
          fontSize: englishSize,
          lineHeight: 1.34,
          fontWeight: 500,
          letterSpacing: "-0.006em",
          color: theme.ink,
        }}
      >
        <span
          style={{
            background: theme.highlight,
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
            padding: "0.05em 0.22em 0.08em",
            margin: "0 -0.22em",
            borderRadius: 9,
            lineHeight: 1.68,
          }}
        >
          {cue.en}
        </span>
      </div>
      <div
        style={{
          marginTop: 15,
          fontFamily: '"BBC Noto Serif SC", serif',
          fontSize:
            cue.zh.length > 58 ? 34 : cue.zh.length > 42 ? 37 : 41,
          lineHeight: 1.48,
          fontWeight: 450,
          color: theme.chinese,
          letterSpacing: "0.01em",
        }}
      >
        <ChineseText text={cue.zh} />
      </div>
    </div>
  );
};

const PreviousSentence: React.FC<{
  cue: CaptionCue;
  progress: number;
}> = ({cue, progress}) => {
  const fontSize =
    cue.en.length > 125
      ? 44
      : cue.en.length > 105
        ? 47
        : cue.en.length > 82
          ? 51
          : 54;
  // Estimate the wrapped height so the previous sentence keeps a compact,
  // consistent visual gap without colliding with the current sentence.
  const estimatedCharactersPerLine = 60 * (50 / fontSize);
  const estimatedLines = Math.max(
    1,
    Math.min(3, Math.ceil(cue.en.length / estimatedCharactersPerLine)),
  );
  const restingY = -(95 + estimatedLines * fontSize * 1.35);
  const y = interpolate(progress, [0, 1], [0, restingY]);
  const scale = interpolate(progress, [0, 1], [1, 0.92]);
  const opacity = interpolate(progress, [0, 1], [1, 0.28]);
  return (
    <div
      style={{
        position: "absolute",
        left: 158,
        right: 158,
        top: 455,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        transformOrigin: "left center",
        fontFamily: sourceSerifFamily,
        fontSize,
        lineHeight: 1.35,
        fontWeight: 500,
        color: theme.mutedInk,
        letterSpacing: "-0.004em",
      }}
    >
      {cue.en}
    </div>
  );
};

const Header: React.FC<{
  brand: string;
  title: string;
  episode: string;
  current: number;
  total: number;
}> = ({brand, title, episode, current, total}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 76,
        right: 76,
        top: 56,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        zIndex: 3,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: interFamily,
            fontSize: 22,
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: "0.14em",
            color: theme.accent,
          }}
        >
          {brand}
        </div>
        <div
          style={{
            marginTop: 11,
            fontFamily: interFamily,
            fontSize: 25,
            fontWeight: 400,
            color: "oklch(49% 0.015 125)",
          }}
        >
          {title}
          <span style={{marginLeft: 14, opacity: 0.52}}>· {episode}</span>
        </div>
      </div>
      <div
        style={{
          fontFamily: sourceSerifFamily,
          fontSize: 25,
          color: "oklch(58% 0.015 125)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(Math.max(0, current)).padStart(3, "0")} /{" "}
        {String(total).padStart(3, "0")}
      </div>
    </div>
  );
};

export const BBCBilingualVideo: React.FC<BilingualVideoProps> = ({
  data,
  clipStartMs,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeMs = clipStartMs + (frame / fps) * 1000;
  const startedIndex = binarySearchActiveCue(data.cues, timeMs);
  const active = startedIndex >= 0 ? data.cues[startedIndex] : null;
  const previousIndex = startedIndex - 1;
  const previous =
    previousIndex >= 0 ? data.cues[previousIndex] : null;
  const transitionDurationMs = 700;
  const currentProgress = active
    ? interpolate(
        timeMs,
        [active.startMs, active.startMs + transitionDurationMs],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        },
      )
    : 0;
  // A completed cue stays in the current position during silence. It only
  // becomes history when the next cue starts and visually pushes it upward.
  const historyStartMs = active?.startMs ?? 0;
  const previousProgress = previous
      ? interpolate(
          timeMs,
          [historyStartMs, historyStartMs + transitionDurationMs],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          },
        )
      : 0;
  const introOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const activeNotice = data.notices?.find(
    (notice) => notice.startMs <= timeMs && timeMs < notice.endMs,
  );
  const noticeOpacity = activeNotice
    ? interpolate(
        timeMs,
        [
          activeNotice.startMs,
          activeNotice.startMs + 300,
          activeNotice.endMs - 300,
          activeNotice.endMs,
        ],
        [0, 1, 1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      )
    : 0;

  return (
    <AbsoluteFill
      style={{
        background: theme.surface,
        color: theme.ink,
        opacity: introOpacity,
      }}
    >
      <style>{chineseFontFace}</style>
      <div
        style={{
          position: "absolute",
          inset: 28,
          overflow: "hidden",
        }}
      >
        <Header
          brand={data.metadata.brand}
          title={data.metadata.title}
          episode={data.metadata.episode}
          current={startedIndex + 1}
          total={data.cues.length}
        />
        {activeNotice ? (
          <div
            style={{
              position: "absolute",
              left: 158,
              right: 158,
              top: 145,
              opacity: noticeOpacity,
              fontFamily: '"BBC Noto Serif SC", serif',
              fontSize: 28,
              lineHeight: 1.4,
              fontWeight: 500,
              color: theme.accentDark,
              letterSpacing: "0.02em",
            }}
          >
            {activeNotice.text}
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: "150px 0 0",
            overflow: "hidden",
            maskImage:
              "linear-gradient(to bottom, transparent 0, black 16%, black 82%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, black 16%, black 82%, transparent 100%)",
          }}
        >
          {previous ? (
            <PreviousSentence
              cue={previous}
              progress={previousProgress}
            />
          ) : null}
          {active ? (
            <CurrentSentence
              cue={active}
              progress={currentProgress}
            />
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
