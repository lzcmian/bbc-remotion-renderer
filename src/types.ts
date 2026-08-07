export type CaptionCue = {
  id: number;
  startMs: number;
  endMs: number;
  en: string;
  zh: string;
};

export type ContentNotice = {
  startMs: number;
  endMs: number;
  text: string;
};

export type CaptionData = {
  metadata: {
    brand: string;
    title: string;
    episode: string;
  };
  durationMs: number;
  notices?: ContentNotice[];
  cues: CaptionCue[];
};

export type BilingualVideoProps = {
  data: CaptionData;
  clipStartMs: number;
};
