import React from "react";
import { Composition } from "remotion";
import { TestComposition, testDefaultProps } from "./Test";
import { BakeoffScene, bakeoffDefaultProps } from "./Bakeoff";

/**
 * Phase 1: a single 10-second smoke-test composition that proves the local
 * render path (intro -> one kinetic-text scene with a subtitle -> outro, over a
 * continuous dummy audio track). Phase 3 adds the real Main / MainShort /
 * Thumbnail compositions that read render/props.json.
 *
 * Render it with:
 *   npx remotion render TestComposition out/test.mp4
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="TestComposition"
      component={TestComposition}
      durationInFrames={300} // 10s @ 30fps
      fps={30}
      width={1920}
      height={1080}
      defaultProps={testDefaultProps}
    />
      <Composition
        id="BakeoffRemotion"
        component={BakeoffScene}
        durationInFrames={180} // 6s @ 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={bakeoffDefaultProps}
      />
    </>
  );
};
