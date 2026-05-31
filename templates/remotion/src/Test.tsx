import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { BackgroundFX } from "./components/BackgroundFX";
import { Intro } from "./components/Intro";
import { KineticText } from "./components/KineticText";
import { Outro } from "./components/Outro";
import { Subtitles, SubtitleWord } from "./components/Subtitles";

export type TestProps = {
  wordmark: string;
  tagline: string;
  headlineWords: string[];
  emphasizeIndex: number;
  subtitle: SubtitleWord[];
  cta: string;
  brand: string;
  /** file in public/, played continuously and never cut (timing contract) */
  audioFile: string;
};

export const testDefaultProps: TestProps = {
  wordmark: "AI Automatizacija",
  tagline: "tvoj AI kanal",
  headlineWords: ["Render", "pipeline", "radi"],
  emphasizeIndex: 2,
  // word start frames are RELATIVE to the subtitle sequence (starts at frame 72)
  subtitle: [
    { text: "Ovo", from: 0 },
    { text: "je", from: 14 },
    { text: "test", from: 26 },
    { text: "render", from: 42 },
    { text: "—", from: 58 },
    { text: "intro,", from: 70 },
    { text: "titl", from: 90 },
    { text: "i", from: 104 },
    { text: "outro.", from: 114 },
  ],
  cta: "Pretplati se",
  brand: "AI Automatizacija",
  audioFile: "dummy-narration.wav",
};

/**
 * Phase-1 smoke test (10s @ 30fps = 300 frames):
 *   0–60   Intro sting
 *   60–240 KineticText scene + one burned-in animated subtitle line
 *   240–300 Outro card
 * A continuous dummy audio track plays underneath the whole thing and is never
 * cut — that's the production timing contract (ARCHITECTURE §6), proven here.
 */
export const TestComposition: React.FC<TestProps> = (props) => {
  return (
    <AbsoluteFill>
      <BackgroundFX />

      {/* one continuous audio track for the whole composition */}
      <Audio src={staticFile(props.audioFile)} volume={0.5} />

      <Sequence from={0} durationInFrames={60} name="Intro">
        <Intro wordmark={props.wordmark} tagline={props.tagline} />
      </Sequence>

      <Sequence from={60} durationInFrames={180} name="Scene">
        <KineticText
          words={props.headlineWords}
          emphasizeIndex={props.emphasizeIndex}
        />
      </Sequence>

      <Sequence from={72} durationInFrames={156} name="Subtitle">
        <Subtitles words={props.subtitle} />
      </Sequence>

      <Sequence from={240} durationInFrames={60} name="Outro">
        <Outro cta={props.cta} brand={props.brand} />
      </Sequence>
    </AbsoluteFill>
  );
};
