import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "./theme";
import { BackgroundFX } from "./components/BackgroundFX";
import { renderTemplate, TemplateName } from "./templates/templates";
import { HookStatReveal } from "./custom/HookStatReveal";
import { PromptFocus } from "./custom/PromptFocus";

/**
 * Internal DEV preview (not published): every scene template back-to-back with
 * sample data, to eyeball that each is on-brand and legible.
 *
 *   npx remotion render TemplateGallery out/template-gallery.mp4
 */
const SEG = 125; // ~4.2s @ 30fps per template

export const GALLERY: { name: TemplateName; data: any }[] = [
  { name: "hook-card", data: { kicker: "The Automation Desk", title: "Still doing this by hand?", subtitle: "3 boring tasks AI can take off your plate." } },
  { name: "section-header", data: { index: 1, title: "Clean messy spreadsheet imports" } },
  { name: "flow", data: { title: "The whole loop", steps: [{ icon: "spreadsheet", label: "Boring task\n(trigger)" }, { icon: "ai", label: "AI does\nthe messy part", accent: true }, { icon: "check", label: "You check\n& approve" }] } },
  { name: "icon-list", data: { title: "The boring goldmine", items: [{ icon: "spreadsheet", label: "Data between spreadsheets" }, { icon: "invoice", label: "Invoices" }, { icon: "calendar", label: "Schedules" }, { icon: "email", label: "Reminder & invite emails" }] } },
  { name: "bullet-steps", data: { title: "What you get here", items: ["Small ideas you can copy", "Tiny working examples", "Plain English, no hype"] } },
  { name: "stat-callout", data: { value: "Once.", label: "Set it up once - then it runs while your coffee's still hot." } },
  { name: "stat-callout", data: { value: "26,000", label: "support tickets auto-tagged last month" } },
  { name: "term-highlight", data: { term: "ARRAYFORMULA", definition: "One formula that fills an entire column automatically." } },
  { name: "comparison-table", data: { title: "Make vs Zapier vs n8n", columns: ["Criteria", "Make", "Zapier", "n8n"], rows: [["Price", "$", "$$", "Free"], ["Ease", "Medium", "Easy", "Harder"], ["Best for", "Visual", "Beginners", "Self-host"]] } },
  { name: "diagram", data: { title: "How the automation runs", nodes: [{ id: "a", label: "New row added" }, { id: "b", label: "AI cleans it" }, { id: "c", label: "Email sent" }], edges: [{ from: "a", to: "b" }, { from: "b", to: "c" }] } },
  { name: "code-block", data: { title: "One line does it", code: "=ARRAYFORMULA(\n  IF(A2:A=\"\", \"\",\n     CLEAN(TRIM(A2:A)))\n)", highlight: [2] } },
  { name: "capture-segment", data: { capture_id: "sheets-demo", caption: "Then scale it to thousands of rows" } },
  { name: "cta-card", data: { title: "Stick around", subtitle: "for more automation ideas" } },
];

export const GALLERY_FRAMES = (GALLERY.length + 2) * SEG;

export const TemplateGallery: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: theme.color.bg }}>
    <BackgroundFX />
    {GALLERY.map((s, i) => (
      <Sequence key={i} from={i * SEG} durationInFrames={SEG} name={s.name}>
        {renderTemplate(s.name, s.data)}
      </Sequence>
    ))}
    {/* bespoke (custom) hook-class scene preview */}
    <Sequence from={GALLERY.length * SEG} durationInFrames={SEG} name="hook-stat-reveal">
      <HookStatReveal data={{ stat: "26,000", statLabel: "invoices a year — entered by hand", punch: "Until we automated it." }} />
    </Sequence>
    {/* MOTIVATED-MOTION proof: prompt card slides in (PiP) → focal zoom punches into it → out */}
    <Sequence from={(GALLERY.length + 1) * SEG} durationInFrames={SEG} name="prompt-focus">
      <PromptFocus />
    </Sequence>
  </AbsoluteFill>
);
