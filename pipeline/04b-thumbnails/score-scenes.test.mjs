// 04b — thumbnail scene scorer. Pins the plan's verification contract: hero beats icon-wall
// beats title-card; CTA scenes are excluded; `reasons` lists exactly the fired criteria; and
// tuning = changing a weight, never logic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { WEIGHTS, thumbnailScore, scoreScenes, propShape, EXCLUDED_TEMPLATES } from "./score-scenes.mjs";

const hero = {
  scene_id: "s01.0",
  engine: "hyperframes",
  template: "hook-card",
  props: { hf_scene: "hook-self-assembly", title: "An AI made this video", note: "long authoring note that must not count as rendered text ".repeat(4) },
};
const iconWall = {
  scene_id: "s14.0",
  engine: "hyperframes",
  template: "diagram",
  props: {
    hf_scene: "pipeline-recap",
    nodes: Array.from({ length: 11 }, (_, i) => ({ id: `n${i}`, label: `Node ${i}` })),
    edges: Array.from({ length: 10 }, (_, i) => ({ from: `n${i}`, to: `n${i + 1}` })),
  },
};
const titleCard = {
  scene_id: "s06.0",
  engine: "remotion",
  template: "section-header",
  props: { title: "The Machine", subtitle: "Watch the shape — steal it at the end" },
};
const cta = {
  scene_id: "s17.0",
  engine: "hyperframes",
  template: "cta-card",
  props: { hf_scene: "lab-outro", title: "Subscribe · The Automation Desk" },
};
const bigStat = {
  scene_id: "s05.0",
  engine: "hyperframes",
  template: "stat-callout",
  props: { hf_scene: "gray-pile-flaw", value: "60", label: "videos a month — zero checks", source: "Medium · AI Monks (2026)", questions: ["true?", "original?", "watchable?"] },
};

test("ordering: hero beats icon-wall beats title-card (and a big stat beats the wall too)", () => {
  const h = thumbnailScore(hero, { index: 0 }).score;
  const s = thumbnailScore(bigStat, { index: 3 }).score;
  const w = thumbnailScore(iconWall, { index: 13 }).score;
  const t = thumbnailScore(titleCard, { index: 5 });
  assert.ok(h > s, `hero (${h}) must beat big-stat (${s})`);
  assert.ok(s > w, `big-stat (${s}) must beat icon-wall (${w})`);
  assert.ok(w > t.score, `icon-wall (${w}) must beat title-card (${t.score})`);
  assert.equal(t.excluded, true, "a bare title-on-background card is a thumbnail reject (no-title-card rule)");
});

test("a section-header WITH visual elements (arrays/value) is not a bare title card — stays scoreable", () => {
  const wordWorld = {
    template: "section-header",
    engine: "hyperframes",
    props: { hf_scene: "steal-the-shape", title: "Draft → Check → Gate", acts: ["DRAFT", "CHECK", "GATE"] },
  };
  const r = thumbnailScore(wordWorld, { index: 15 });
  assert.ok(!r.excluded, "visual section-header must not be excluded");
  assert.ok(r.score > 0);
});

test("CTA / outro / transition scenes are excluded outright (score 0, excluded flag)", () => {
  const r = thumbnailScore(cta, { index: 16 });
  assert.equal(r.score, 0);
  assert.equal(r.excluded, true);
  assert.deepEqual(r.reasons, []);
  for (const template of EXCLUDED_TEMPLATES) {
    assert.equal(thumbnailScore({ template, props: {} }).excluded, true, `${template} must be excluded`);
  }
  // an outro-named HyperFrames scene is excluded even under a non-CTA template tag
  assert.equal(thumbnailScore({ template: "section-header", props: { hf_scene: "lab-outro" } }).excluded, true);
});

test("reasons lists exactly the fired criteria, and the score is their sum", () => {
  const r = thumbnailScore(hero, { index: 0 });
  assert.deepEqual(r.reasons, ["hero_scene", "high_contrast", "dominant_focal", "minimal_text", "low_clutter", "no_cta"]);
  assert.equal(r.score, r.reasons.reduce((s, k) => s + WEIGHTS[k], 0));

  const w = thumbnailScore(iconWall, { index: 13 });
  assert.ok(!w.reasons.includes("low_clutter"), "11-node diagram must lose low_clutter");
  assert.ok(!w.reasons.includes("dominant_focal"), "11-node diagram has no single dominant focal");
  assert.ok(w.reasons.includes("hero_scene"));
});

test("changing a weight changes the score without touching logic", () => {
  const before = thumbnailScore(bigStat, { index: 3 });
  const original = WEIGHTS.dominant_focal;
  try {
    WEIGHTS.dominant_focal = original + 7;
    const after = thumbnailScore(bigStat, { index: 3 });
    assert.equal(after.score, before.score + 7, "score moves by exactly the weight delta");
    assert.deepEqual(after.reasons, before.reasons, "fired criteria unchanged");
  } finally {
    WEIGHTS.dominant_focal = original;
  }
});

test("high_contrast fires for the opener and hook-class scenes only", () => {
  const opener = thumbnailScore({ ...bigStat }, { index: 0 });
  const body = thumbnailScore({ ...bigStat }, { index: 3 });
  assert.ok(opener.reasons.includes("high_contrast"));
  assert.ok(!body.reasons.includes("high_contrast"));
  assert.ok(thumbnailScore(hero, { index: 9 }).reasons.includes("high_contrast"), "hook-class fires anywhere");
});

test("propShape: notes/hf_scene/source never count as rendered text; nested arrays counted", () => {
  const shape = propShape({
    note: "x".repeat(500),
    hf_scene: "hook-foo",
    source: "YouTube Help",
    title: "Hi",
    stat: { value: "60", label: "abc", source: "y".repeat(200) },
    items: ["a", "b", { label: "c" }],
  });
  assert.equal(shape.textChars, 2 + 2 + 3 + 1 + 1 + 1); // title + value + label + "a" + "b" + nested label
  assert.equal(shape.maxArrayLen, 3);
  assert.equal(shape.totalArrayItems, 3);
});

test("scoreScenes ranks a timeline best-first, stable on ties (earlier scene wins)", () => {
  const timeline = { scenes: [cta, titleCard, hero, bigStat, iconWall].map((s, i) => ({ ...s, scene_id: `s${i}` })) };
  const ranked = scoreScenes(timeline);
  assert.equal(ranked[0].scene_id, "s2", "hero first");
  assert.deepEqual(ranked.slice(-2).map((r) => r.excluded), [true, true], "excluded CTA + title card sink to the bottom");
  assert.equal(ranked[0].index, 2);
  // a true tie (identical scenes at body indices) keeps timeline order
  const three = { scenes: [{ ...titleCard, scene_id: "t0" }, { ...bigStat, scene_id: "t1" }, { ...bigStat, scene_id: "t2" }] };
  const r3 = scoreScenes(three);
  assert.equal(r3[0].scene_id, "t1", "earlier of the tied pair ranks first");
  assert.equal(r3[1].scene_id, "t2");
});
