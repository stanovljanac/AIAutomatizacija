import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { theme } from "./theme";
import { BackgroundFX } from "./components/BackgroundFX";
import { SceneWrapper } from "./components/SceneWrapper";
import { Intro } from "./components/Intro";
import { Outro } from "./components/Outro";
import { CaptionsTrack, CaptionCue } from "./components/CaptionsTrack";
import { renderTemplate, TemplateName } from "./templates/templates";
import { SpreadsheetClean } from "./custom/SpreadsheetClean";
import { HandCopy } from "./custom/HandCopy";
import { AiFlow } from "./custom/AiFlow";
import { ChaosX } from "./custom/ChaosX";
import { DeskScene } from "./custom/DeskScene";

/** Custom (bespoke) scene dispatch — template:"custom" routes by props.component. */
const CUSTOM: Record<string, React.FC<{ data?: any }>> = {
  "spreadsheet-clean": SpreadsheetClean,
  "hand-copy": HandCopy,
  "ai-flow": AiFlow,
  "chaos-x": ChaosX,
  "desk-scene": DeskScene,
};

export type Scene = {
  sceneId: string;
  template: TemplateName | "custom";
  props: any;
  fromFrame: number;
  durFrames: number;
};

export type MainProps = {
  fps: number;
  width: number;
  height: number;
  introFrames: number;
  outroFrames: number;
  totalFrames: number;
  crossfadeFrames: number;
  audioSrc: string;
  audioFromFrame: number;
  intro: { wordmark: string; tagline: string };
  outro: { cta: string; brand: string };
  scenes: Scene[];
  captions: CaptionCue[];
};

const renderScene = (template: string, props: any) => {
  if (template === "custom") {
    const Cmp = CUSTOM[props?.component] ?? (() => null);
    return <Cmp data={props} />;
  }
  return renderTemplate(template as TemplateName, props);
};

export const Main: React.FC<MainProps> = (p) => {
  const xf = p.crossfadeFrames ?? 9;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.color.bg }}>
      {/* persistent background — never resets between scenes (continuity) */}
      <BackgroundFX />

      {/* one continuous narration track, never cut (starts after the intro) */}
      <Sequence from={p.audioFromFrame} name="audio">
        <Audio src={staticFile(p.audioSrc)} />
      </Sequence>

      <Sequence from={0} durationInFrames={p.introFrames + xf} name="Intro">
        <SceneWrapper durFrames={p.introFrames + xf} overlap={xf}>
          <Intro wordmark={p.intro.wordmark} tagline={p.intro.tagline} />
        </SceneWrapper>
      </Sequence>

      {/* scenes/beats placed in time from the alignment, crossfading */}
      {p.scenes.map((s) => (
        <Sequence key={s.sceneId} from={s.fromFrame} durationInFrames={s.durFrames} name={s.sceneId}>
          <SceneWrapper durFrames={s.durFrames} overlap={xf}>
            {renderScene(s.template, s.props)}
          </SceneWrapper>
        </Sequence>
      ))}

      {/* burned-in captions (absolute-timed cues) */}
      <CaptionsTrack cues={p.captions} />

      <Sequence from={p.totalFrames - p.outroFrames - xf} durationInFrames={p.outroFrames + xf} name="Outro">
        <SceneWrapper durFrames={p.outroFrames + xf} overlap={xf}>
          <Outro cta={p.outro.cta} brand={p.outro.brand} />
        </SceneWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};
