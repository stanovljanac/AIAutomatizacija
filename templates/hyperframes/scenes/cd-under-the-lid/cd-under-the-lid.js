/* cd-under-the-lid — GSAP timeline for 020 s2 (THE CAUSE). Opens on the SAME dashboard card s1
 * ended on (the match cut), peels it away like a lid, and shows the raw rows underneath: one city
 * in three spellings counted as three, two "dates" that are text. Nothing errors — the green check
 * just goes hollow. Deterministic, seek-driven; flat, face-on (the peel is a transient 3D reveal).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cd-under-the-lid", width: 1080, height: 1920, frames: 307, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt;

// sentence beats: [0] "Then I looked underneath." (lid peels) [1] "One city, three spellings, counted
// as three." (highlight + bracket + ghost bars) [2] "Some dates weren't even dates…" (amber tags, rows
// drop, total unmoved) [3] "Nothing errored." (check goes hollow, rows compress into one bad row)
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.1), t0 + 0.7);
var t2 = Math.max(beatAt(2, 0.45), t1 + 2.4);
var t3 = Math.max(beatAt(3, 0.87), t2 + 2.4);

// the sheet rows carrying the three spellings of one city
var HITS = ["#r1", "#r2", "#r4"];
// the two rows whose "date" is really text
var BADDATES = [{ row: "#r2", tag: "#dtag2" }, { row: "#r4", tag: "#dtag4" }];

// ── layout pass: pin the bracket and the amber tags to the ROWS they annotate ──
// (measured, not hardcoded — the row metrics come from the font, so a copy edit can't desync them)
function pinToRows() {
  var sheet = document.getElementById("sheet");
  var sBox = sheet.getBoundingClientRect();
  var first = document.querySelector(HITS[0]).getBoundingClientRect();
  var last = document.querySelector(HITS[HITS.length - 1]).getBoundingClientRect();
  var br = document.getElementById("bracket");
  br.style.top = first.top - sBox.top + "px";
  br.style.height = last.bottom - first.top + "px";
  BADDATES.forEach(function (b) {
    var rb = document.querySelector(b.row).getBoundingClientRect();
    var tag = document.querySelector(b.tag);
    // centred on the row it annotates — a tag hanging BELOW would sit over the next row's date
    tag.style.top = rb.top + (rb.height - tag.getBoundingClientRect().height) / 2 + "px";
  });
}
pinToRows();

// ── resting state ──
gsap.set("#lid", { opacity: 1, rotationX: 0, y: 0 });
gsap.set("#sheet", { opacity: 0, y: 24 * U });
gsap.set("#ghost", { opacity: 0 });
gsap.set(".gbar", { scaleY: 0 });
gsap.set("#gnote", { opacity: 0 });
gsap.set("#bracket", { opacity: 0, scaleY: 0.5 });
gsap.set("#blabel", { opacity: 0, y: 18 * U });
gsap.set(".dtag", { opacity: 0, x: -20 * U });
gsap.set("#total", { opacity: 0 });
gsap.set("#onerow", { opacity: 0, scale: 0.86 });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the lid PEELS AWAY from a top hinge, revealing the raw rows ──
// (the opening frame IS the s1 card, so the cut rhymes; the peel is the only move)
tl.to("#lid", { rotationX: -84, y: -40 * U, duration: 0.62, ease: "power2.in" }, t0 + 0.08);
tl.to("#lid", { opacity: 0, duration: 0.3, ease: "power2.in" }, t0 + 0.42);
tl.to("#sheet", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0 + 0.34);
tl.to("#total", { opacity: 1, duration: 0.4, ease: "power2.out" }, t0 + 0.52);

// ── beat 1 — the three spellings light up, the bracket ties them, the ghost chart splits them ──
HITS.forEach(function (r, i) {
  tl.call(function () { document.querySelector(r).classList.add("hit"); }, null, t1 + i * 0.16);
  tl.fromTo(r, { x: -10 * U }, { x: 0, duration: 0.3, ease: "power2.out" }, t1 + i * 0.16);
});
tl.to("#bracket", { opacity: 1, scaleY: 1, duration: 0.36, ease: "power3.out" }, t1 + 0.52);
tl.to("#blabel", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t1 + 0.68);
// the ghost chart above: the SAME city, three separate bars — the bug made visible
tl.to("#ghost", { opacity: 1, duration: 0.3 }, t1 + 0.66);
["#g1", "#g2", "#g3"].forEach(function (g, i) {
  tl.to(g, { scaleY: 1, duration: 0.34, ease: "back.out(1.6)" }, t1 + 0.72 + i * 0.12);
});
tl.to("#gnote", { opacity: 1, duration: 0.3, ease: "power2.out" }, t1 + 1.12);

// ── beat 2 — the "dates" that are text drop out; the total does NOT move ──
BADDATES.forEach(function (b, i) {
  var at = t2 + i * 0.5;
  tl.call(function () { document.querySelector(b.row + " .date").style.color = "#ffc861"; }, null, at);
  tl.to(b.tag, { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" }, at);
  // the row falls out of the sheet — its sale never reached the total
  tl.to(b.row, { opacity: 0.15, x: 46 * U, duration: 0.45, ease: "power2.in" }, at + 0.55);
  tl.to(b.tag, { opacity: 0, x: 46 * U, duration: 0.45, ease: "power2.in" }, at + 0.55);
});
// the total is nudged to prove it did NOT change — a single flat pulse, no count
tl.to("#total", { borderColor: "rgba(255,200,97,0.55)", duration: 0.4, yoyo: true, repeat: 1, ease: "sine.inOut" }, t2 + 1.25);

// ── beat 3 — the check goes HOLLOW (no error was ever raised), then the rows compress into one ──
tl.to("#tick", { opacity: 0.12, duration: 0.14, yoyo: true, repeat: 3, ease: "none" }, t3);
tl.to("#tick", { opacity: 0, duration: 0.3, ease: "power2.out" }, t3 + 0.6);
tl.to("#check", { boxShadow: "0 0 0 rgba(52,211,153,0)", borderColor: "rgba(52,211,153,0.42)", duration: 0.4, ease: "sine.out" }, t3 + 0.6);
// the three highlighted rows collapse into ONE glowing bad row — s3 opens on it, same size/position
tl.to(["#sheet", "#ghost", "#total", "#blabel"], { opacity: 0.08, duration: 0.36, ease: "power2.in" }, t3 + 0.74);
tl.to("#onerow", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }, t3 + 0.82);

HF.register("cd-under-the-lid", tl);
