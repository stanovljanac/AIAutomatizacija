import React from "react";
import { Composition } from "remotion";
import { TemplateGallery, GALLERY_FRAMES } from "./TemplateGallery";
import { Main, MainProps } from "./Main";

const mainPlaceholder: MainProps = {
  fps: 30, width: 1920, height: 1080,
  introFrames: 45, outroFrames: 75, totalFrames: 300, crossfadeFrames: 9,
  audioSrc: "", audioFromFrame: 45,
  intro: { wordmark: "Boring AI Automations", tagline: "automate the boring stuff" },
  outro: { cta: "Stick around", brand: "Boring AI Automations" },
  scenes: [], captions: [],
};

/**
 * Compositions:
 *  - Main: the real video renderer (reads render props via --props + calculateMetadata).
 *  - TemplateGallery: internal dev preview of every scene template (not published).
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={mainPlaceholder}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.totalFrames ?? 300,
          fps: props.fps ?? 30,
          width: props.width ?? 1920,
          height: props.height ?? 1080,
        })}
      />
      <Composition
        id="TemplateGallery"
        component={TemplateGallery}
        durationInFrames={GALLERY_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
