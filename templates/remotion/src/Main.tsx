import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { theme } from "./theme";
import { BackgroundFX } from "./components/BackgroundFX";
import { SceneWrapper } from "./components/SceneWrapper";
import { Intro } from "./components/Intro";
import { Outro } from "./components/Outro";
import { CaptionsTrack, CaptionCue } from "./components/CaptionsTrack";
import { renderTemplate, TemplateName } from "./templates/templates";
import { FocalZoom } from "./components/FocalZoom";
import { MotionContext, DEFAULT_MOTION, MotionBudget } from "./lib/motion";
import { SpreadsheetClean } from "./custom/SpreadsheetClean";
import { HandCopy } from "./custom/HandCopy";
import { AiFlow } from "./custom/AiFlow";
import { ChaosX } from "./custom/ChaosX";
import { DeskScene } from "./custom/DeskScene";
import { DeskScatter } from "./custom/DeskScatter";
import { CalendarFind } from "./custom/CalendarFind";
import { InboxTriage } from "./custom/InboxTriage";
import { MorningSynthesis } from "./custom/MorningSynthesis";
import { VersusNote } from "./custom/VersusNote";
import { HookStatReveal } from "./custom/HookStatReveal";
import { PromptFocus } from "./custom/PromptFocus";

/** Custom (bespoke) scene dispatch — template:"custom" routes by props.component. */
const CUSTOM: Record<string, React.FC<{ data?: any }>> = {
  "spreadsheet-clean": SpreadsheetClean,
  "versus-note": VersusNote,
  "hook-stat-reveal": HookStatReveal,
  "prompt-focus": PromptFocus,
  "hand-copy": HandCopy,
  "ai-flow": AiFlow,
  "chaos-x": ChaosX,
  "desk-scene": DeskScene,
  "desk-scatter": DeskScatter,
  "calendar-find": CalendarFind,
  "inbox-triage": InboxTriage,
  "morning": MorningSynthesis,
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
  motion?: MotionBudget;
  scenes: Scene[];
  captions: CaptionCue[];
};

const renderScene = (template: string, props: any) => {
  const inner =
    template === "custom"
      ? React.createElement(CUSTOM[props?.component] ?? (() => null), { data: props })
      : renderTemplate(template as TemplateName, props);
  // Opt-in MOTIVATED motion: a non-custom scene with props.focalZoom punches into its target on cue
  // and releases when done. Custom scenes own their motion internally (no double-wrap).
  const fz = props?.focalZoom;
  if (template !== "custom" && fz?.target && fz.scale > 1) {
    return (
      <FocalZoom target={fz.target} scale={fz.scale} inAt={fz.inAt} outAt={fz.outAt} dur={fz.dur}>
        {inner}
      </FocalZoom>
    );
  }
  return inner;
};

export const Main: React.FC<MainProps> = (p) => {
  const xf = p.crossfadeFrames ?? 9;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.color.bg }}>
      <MotionContext.Provider value={p.motion ?? DEFAULT_MOTION}>
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
          <SceneWrapper durFrames={s.durFrames} overlap={xf} broll={s.props?.brollSrc}>
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
      </MotionContext.Provider>
    </AbsoluteFill>
  );
};
