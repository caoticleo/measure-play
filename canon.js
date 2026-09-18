/* Measure Engine v0.1 — Pillar 01 */
const VEALE = { L_MEAN: 13.12, L_SD: 1.66, G_MEAN: 11.66, G_SD: 1.10 };
const VESSEL = { D_REST: 6.3, D_AROUSED: 11.5, D_SD: 1.4, C_REST: 8.2, C_SD: 0.9 };
const MARK_LINE = 18;
const ORDERS = [
  { id: "Nub", min: 0, max: 8, inscription: "Inversion, denial, clitty-path, priest of the small." },
  { id: "Modest", min: 8, max: 12, inscription: "Budgeting self. Technique, devotion, envy, or peace." },
  { id: "Common", min: 12, max: 15, inscription: "Citizen flesh. Invisible until measured." },
  { id: "Noted", min: 15, max: 18, inscription: "Rumor starts. First real social power." },
  { id: "Claimant", min: 18, max: 23, inscription: "Pairing rights tilt. Plans form around this body." },
  { id: "Sovereign", min: 23, max: 30, inscription: "Rooms change. Injury is on the table." },
  { id: "Mythic", min: 30, max: 45, inscription: "Cult, hunt, or weapon. Needs a mythic vessel." },
  { id: "Titan", min: 45, max: 80, inscription: "Architecture problem. A room around a penis." }
];
const FILL = [
  { max: 0.7, text: "Instrument-light. Technique, hands, toys, third body, or ache." },
  { max: 1.1, text: "Near-match. Daily bread. Fullness without wreck." },
  { max: 1.4, text: "Deep. Cervix-knock on mundane vessels. Pride / wince." },
  { max: 2.0, text: "Wreck-adjacent. Needs prep, pacing, or a Marked vessel." },
  { max: 99, text: "Mythic act. Do not treat as ordinary penetration." }
];
const STRETCH = [
  { max: 1.1, text: "Easy entry. Little stretch story." },
  { max: 1.5, text: "Common erotic stretch (mundane mean is already ~1.42)." },
  { max: 2.0, text: "Thick event. Breath, lube, talk, possible pain." },
  { max: 99, text: "Obscene. Opening is the plot." }
];
const SOURCES = {
  mark: ["bloodline wake", "pact", "blessing", "curse", "corruption tick", "temple rite", "old god's joke"],
  shrink: ["inversion pact", "saint's bargain", "cage-rite", "willing rewrite", "punitive Mark"]
};
const INVOICES = {
  cosmetic: { grow: ["A little extra heat in crowds.", "Dreams run longer than they should."], shrink: ["A private joke with the body.", "Clothes fit strangely at the fork."] },
  felt: { grow: ["Hunger leaks into ordinary hours.", "People stand differently in the doorway.", "Kindness starts to look like a gift you know you're giving."], shrink: ["Comparison becomes a clock.", "Identity relocates off the shaft.", "Technique becomes a moral system."] },
  brutal: { grow: ["Fertility will not take no.", "Worship is a cage.", "Temper shortens with the tape."], shrink: ["Public measure is a sentence.", "Desire for the missing inscription becomes weather.", "The body files a complaint every morning."] },
  cosmological: { grow: ["A god is watching the centimeters.", "Towns change their festival calendar.", "The invoice is paid in other people's names."], shrink: ["A sacrament of refusal.", "The small shaft is the world's counter-argument.", "Something large was moved elsewhere on the soul."] }
};
const NAMES = {
  shaft: ["Rui", "Cass", "Maro", "Levi", "Noé", "Harun", "Paz", "Ivo", "Soren", "Nico", "Omar", "Theo", "Vale", "Quinn", "Dario", "Sen"],
  vessel: ["Cleo", "Ira", "Nia", "Sol", "Mira", "Asha", "Jun", "Lila", "Ren", "Vera", "Noa", "Sable", "Pilar", "Wren", "Gia", "Osa"]
};
const MIX = {
  "flesh-only": { mark: 0, shrink: 0.004 },
  "flesh-primary": { mark: 0.05, shrink: 0.02 },
  "marked-common": { mark: 0.18, shrink: 0.05 },
  "mythic-normal": { mark: 0.42, shrink: 0.08 }
};
const MARK_WEIGHTS = [["Claimant", 0.46],["Sovereign", 0.30],["Mythic", 0.17],["Titan", 0.07]];
const state = { tab: "world", world: { publicity: "rumor", law: "custom", layerMix: "flesh-primary", invoice: "felt", seed: "cleo-01" }, cast: [], selected: [], lastRite: null, census: null };
function mulberry32(a) { return function () { let t = (a += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hashSeed(s) { let h = 2166136261; const str = String(s); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngFor(...parts) { return mulberry32(hashSeed(parts.join("|"))); }
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function weighted(rng, pairs) { let x = rng(); for (const [v, w] of pairs) { if ((x -= w) <= 0) return v; } return pairs[pairs.length - 1][0]; }
function gauss(rng, mean, sd) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function round1(n) { return Math.round(n * 10) / 10; }
function cmIn(cm) { return (cm / 2.54).toFixed(1); }
function volume(L, G) { return (G * G * L) / (4 * Math.PI); }
function orderOf(L) { return ORDERS.find((o) => L < o.max) || ORDERS[ORDERS.length - 1]; }
function girthTag(G) { if (G < 10.3) return "slim"; if (G < 13.1) return "true"; if (G <= 16) return "thick"; return "obscene"; }
function bandOf(id) { return ORDERS.find((o) => o.id === id); }
function rollShaft(world, salt) {
  const rng = rngFor(world.seed, "shaft", salt); const mix = MIX[world.layerMix]; const roll = rng();
  let layer = "flesh", source = "mundane growth", L, G;
  if (roll < mix.shrink) { layer = "mark"; source = pick(rng, SOURCES.shrink); L = rng() < 0.7 ? 4 + rng() * 4 : 8 + rng() * 3.5; G = clamp(gauss(rng, 8.6 + L * 0.12, 0.9), 5.5, 14); }
  else if (roll < mix.shrink + mix.mark) { layer = "mark"; source = pick(rng, SOURCES.mark); const id = weighted(rng, MARK_WEIGHTS); const b = bandOf(id); L = b.min + rng() * (b.max - b.min); if (id === "Titan") L = 45 + rng() * 25; G = clamp(gauss(rng, clamp(11.2 + (L - 13) * 0.22, 11, 34), 1.4), 9, 42); }
  else { L = clamp(gauss(rng, VEALE.L_MEAN, VEALE.L_SD), 7.2, 17.8); G = clamp(gauss(rng, VEALE.G_MEAN + (L - VEALE.L_MEAN) * 0.28, VEALE.G_SD * 0.92), 8.2, 16.2); if (L >= MARK_LINE) { layer = "mark"; source = "threshold bleed"; } }
  L = round1(L); G = round1(G); const order = orderOf(L); const tag = girthTag(G); const V = round1(volume(L, G));
  const kind = L < 8 || /inversion|cage|saint|rewrite|punitive/.test(source) ? "shrink" : "grow";
  const invoice = layer === "flesh" && order.id === "Common" ? "None. Citizen flesh pays in ordinary life." : pick(rng, INVOICES[world.invoice][L < 12 && layer === "mark" ? "shrink" : kind]);
  return { type: "shaft", id: "s-" + salt, name: pick(rng, NAMES.shaft) + " " + String.fromCharCode(65 + Math.floor(rng() * 26)) + ".", L, G, V, Lin: cmIn(L), Gin: cmIn(G), order: order.id, inscription: order.inscription, girthTag: tag, layer, source, invoice };
}
function rollVessel(world, salt) {
  const rng = rngFor(world.seed, "vessel", salt); const mix = MIX[world.layerMix]; const marked = rng() < mix.mark * 0.65;
  let D = gauss(rng, VESSEL.D_AROUSED, VESSEL.D_SD); let C = gauss(rng, VESSEL.C_REST, VESSEL.C_SD); let layer = "flesh"; let source = "mundane vessel";
  if (marked) { layer = "mark"; source = pick(rng, ["stretch-blessing", "brood-pact", "trained openness", "hungry rewrite"]); D += 3 + rng() * 10; C += 1.2 + rng() * 4; }
  D = round1(clamp(D, 7.5, marked ? 28 : 16)); const Drest = round1(clamp(D * 0.55, 4.0, marked ? 14 : 9.5)); C = round1(clamp(C, 6.2, marked ? 18 : 11.5));
  const invoice = marked ? pick(rng, INVOICES[world.invoice].grow) : "Provisional vessel. Pillar 02 will replace this roll.";
  return { type: "vessel", id: "v-" + salt, name: pick(rng, NAMES.vessel) + " " + String.fromCharCode(65 + Math.floor(rng() * 26)) + ".", D, Drest, C, layer, source, invoice, provisional: true };
}
function fillBand(FL) { return FILL.find((x) => FL < x.max); }
function stretchBand(FG) { return STRETCH.find((x) => FG < x.max); }
function pair(shaft, vessel, world) {
  const FL = shaft.L / vessel.D; const FG = shaft.G / vessel.C;
  const publicityLine = { secret: "Only they know the tape.", rumor: "The number is already walking ahead of them.", majority: "A clerk once wrote this in a book.", displayed: "The room can see the inscription.", aura: "The Measure hangs in the air before clothes come off." }[world.publicity];
  const lawLine = { private: "Law looks away. Custom still stares.", custom: "Custom will have an opinion at supper.", licensed: "A license may be required if this pairing holds.", caste: "Caste law wants a word before anyone undresses." }[world.law];
  let social = publicityLine + " " + lawLine;
  if (shaft.order === "Nub") social += " The small inscription will be read as role, not absence.";
  if (["Sovereign", "Mythic", "Titan"].includes(shaft.order)) social += " Bystanders become a third character.";
  if (FL > 1.4 && vessel.layer === "flesh") social += " The vessel is mundane. Pace is politics.";
  return { FL: round1(FL), FG: round1(FG), fill: fillBand(FL).text, stretch: stretchBand(FG).text, social };
}
