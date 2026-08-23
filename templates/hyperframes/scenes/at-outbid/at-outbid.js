/* at-outbid — 023 s16. "You are not being ignored. You are being outbid."
 *
 * Premise: "diluted" is the comfortable word and it is wrong — the total is fixed, most of it never
 * reaches your content, and you cannot see the split. So the frame runs an auction with the real
 * measured numbers, knocks the budget down to each claimant in turn, and ends by turning the results
 * board around: the viewer's side of it is blank.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-outbid", width: 1920, height: 1080, frames: 482, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 20, seed: 91, bloomX: 44, bloomY: 34 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var NAMES = props.bidders && props.bidders.length ? props.bidders : ["the first word", "the chatter", "the wrapping", "your line"];
var BIDS = props.bids && props.bids.length ? props.bids : ["25.8%", "23.6%", "40.6%", "10.0%"];
var TRUTH = props.right && props.right.length ? props.right : [
  "the total is fixed",
  "most of it never reaches your content",
  "you cannot see how it was divided",
];

document.getElementById("wrong").textContent = props.wrong || "your important line gets diluted";
document.getElementById("verdict").textContent = props.title || "You're being outbid.";

var host = document.getElementById("bidders");
var cards = [], bars = [], stamps = [];
NAMES.forEach(function (n, i) {
  var isYou = i === NAMES.length - 1;
  var el = FX.el("bd" + (isYou ? " you" : ""), host);
  var nm = FX.el("bdname", el);
  nm.textContent = n;
  var bid = FX.el("bdbid", el);
  bid.textContent = BIDS[i];
  var bw = FX.el("bdbarwrap", el);
  var bar = FX.el("bdbar", bw);
  bar.style.width = "100%";
  var st = FX.el("bdstamp", el);
  st.textContent = isYou ? "last" : "sold";
  cards.push(el);
  bars.push(bar);
  stamps.push(st);
});
/* the bars are scaled to the biggest bid so the cards read as an auction board, not a legend */
var maxBid = Math.max.apply(null, BIDS.map(function (b) { return parseFloat(b); }));

var truthHost = document.getElementById("truth");
var truthEls = TRUTH.map(function (t, i) {
  var row = FX.el("tl", truthHost);
  var n = FX.el("tlnum", row);
  n.textContent = "0" + (i + 1);
  var x = FX.el("tltext", row);
  x.textContent = t;
  return row;
});

/* the results board: what the room can see, and what you can see */
var front = document.getElementById("bfront");
NAMES.forEach(function (n, i) {
  var row = FX.el("bfrow", front);
  var a = FX.el("k", row, "span");
  a.textContent = n;
  var b = FX.el("v", row, "span");
  b.textContent = BIDS[i];
});
front.style.flexDirection = "column";
front.style.gap = "calc(10px * var(--u))";

var b0 = beatAt(0, 0.0);                          // "So the honest version is not 'your important line gets diluted'."
var b1 = Math.max(beatAt(1, 0.20), b0 + 3.0);     // "It is narrower, and worse."
var b2 = Math.max(beatAt(2, 0.30), b1 + 1.2);     // "The total is fixed, most of it never reaches your content…"
var b3 = Math.max(beatAt(3, 0.70), b2 + 5.0);     // "You are not being ignored."
var b4 = Math.max(beatAt(4, 0.80), b3 + 0.9);     // "You are being outbid."

gsap.set("#wrongwrap", { opacity: 0, y: FX.px(-12) });
gsap.set(cards, { opacity: 0, y: FX.px(22) });
gsap.set(bars, { scaleX: 0 });
gsap.set(stamps, { opacity: 0 });
gsap.set(truthEls, { opacity: 0, x: FX.px(-14) });
gsap.set("#board", { opacity: 0 });
gsap.set("#bfront", { rotationY: 0 });
gsap.set("#bback", { rotationY: 180 });
gsap.set("#verdict", { opacity: 0, y: FX.px(18) });

/* the comfortable word, written and struck */
tl.to("#wrongwrap", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, b0);
tl.to("#wslash", { scaleX: 1, duration: 0.26, ease: "power3.out" }, b1);
tl.to("#wrongwrap", { opacity: 0.4, duration: 0.34 }, b1 + 0.25);

/* the auction: each claimant is knocked down in turn, yours last and smallest */
cards.forEach(function (el, i) {
  var at = b0 + 0.4 + i * 0.5;
  tl.to(el, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, at);
  tl.to(bars[i], { scaleX: parseFloat(BIDS[i]) / maxBid, duration: 0.4, ease: "power3.out" }, at + 0.15);
  tl.to(stamps[i], { opacity: 1, duration: 0.2 }, at + 0.45);
});

/* the narrower, worse version — one line at a time */
truthEls.forEach(function (el, i) {
  tl.to(el, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out" }, b2 + 0.15 + i * 0.9);
});

/* and the board turns: on your side there is nothing to read */
tl.to("#board", { opacity: 1, duration: 0.3 }, b2 + 0.4);
tl.to("#bfront", { rotationY: 180, duration: 0.7, ease: "power2.inOut" }, b2 + 2.3);
tl.to("#bback", { rotationY: 360, duration: 0.7, ease: "power2.inOut" }, b2 + 2.3);

tl.to("#verdict", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, b4);
FX.fromTo(tl, cards[cards.length - 1], { scale: 1 }, { scale: 1.04, duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, b4 + 0.1);
FX.camera(tl, { at: b3, scale: 1.02, dur: Math.max(D - b3 - 0.2, 0.6), ease: "sine.out" });

HF.register("at-outbid", tl);
