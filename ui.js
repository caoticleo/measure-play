function el(id) { return document.getElementById(id); }
function setTab(name) {
  state.tab = name;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("on", p.id === "panel-" + name));
}
function readWorld() {
  state.world.publicity = el("pub").value;
  state.world.law = el("law").value;
  state.world.layerMix = el("mix").value;
  state.world.invoice = el("inv").value;
  state.world.seed = el("seed").value.trim() || "cleo-01";
}
function barWidth(cm, max) { return Math.min(100, (cm / max) * 100); }
function shaftCard(s, opts = {}) {
  const maxL = state.world.layerMix === "mythic-normal" ? 50 : 30;
  return `<article class="card body-card" data-id="${s.id}" data-type="shaft"><header><h3>${s.name}</h3><div><span class="pill ${s.order}">${s.order}</span> <span class="pill ${s.girthTag}">${s.girthTag}</span> <span class="pill ${s.layer}">${s.layer}</span></div></header><div class="nums"><div><b>${s.L}</b><span>L cm · ${s.Lin}"</span></div><div><b>${s.G}</b><span>G cm · ${s.Gin}"</span></div><div><b>${s.V}</b><span>V cm³</span></div></div><div class="statbar"><i style="width:${barWidth(s.L, maxL)}%"></i></div><p class="meta">${s.source} · ${s.inscription}</p><p class="invoice">${s.invoice}</p>${opts.extra || ""}</article>`;
}
function vesselCard(v) {
  return `<article class="card body-card" data-id="${v.id}" data-type="vessel"><header><h3>${v.name}</h3><div><span class="pill Common">vessel</span> <span class="pill ${v.layer}">${v.layer}</span> ${v.provisional ? '<span class="pill">provisional</span>' : ""}</div></header><div class="nums"><div><b>${v.D}</b><span>aroused depth cm</span></div><div><b>${v.Drest}</b><span>rest depth cm</span></div><div><b>${v.C}</b><span>introitus cm</span></div></div><p class="meta">${v.source}</p><p class="invoice">${v.invoice}</p></article>`;
}
function renderCast() {
  const box = el("cast-grid");
  if (!state.cast.length) { box.innerHTML = `<div class="card"><p class="invoice">Roll a cast from the World tab.</p></div>`; return; }
  box.innerHTML = state.cast.map((b) => (b.type === "shaft" ? shaftCard(b) : vesselCard(b))).join("");
  box.querySelectorAll(".body-card").forEach((card) => {
    card.classList.toggle("sel", state.selected.includes(card.dataset.id));
    card.addEventListener("click", () => toggleSelect(card.dataset.id));
  });
}
function toggleSelect(id) {
  const i = state.selected.indexOf(id);
  if (i >= 0) state.selected.splice(i, 1);
  else {
    const body = state.cast.find((b) => b.id === id);
    if (body.type === "shaft") {
      state.selected = state.selected.filter((x) => { const b = state.cast.find((c) => c.id === x); return b && b.type !== "shaft"; });
      state.selected.unshift(id);
    } else {
      state.selected = state.selected.filter((x) => { const b = state.cast.find((c) => c.id === x); return b && b.type !== "vessel"; });
      state.selected.push(id);
    }
    state.selected = state.selected.slice(0, 2);
  }
  renderCast(); renderPair();
  if (bodyOf(id).type === "shaft") { state.lastRite = bodyOf(id); renderRite(); }
}
function bodyOf(id) { return state.cast.find((b) => b.id === id); }
function rollCast(n = 8) {
  readWorld(); state.cast = []; state.selected = [];
  for (let i = 0; i < n; i++) {
    const salt = Date.now().toString(36) + "-" + i + "-" + Math.random().toString(36).slice(2, 6);
    state.cast.push(rngFor(state.world.seed, salt)() < 0.32 ? rollVessel(state.world, salt) : rollShaft(state.world, salt));
  }
  if (!state.cast.some((b) => b.type === "shaft")) state.cast[0] = rollShaft(state.world, "force-s");
  if (!state.cast.some((b) => b.type === "vessel")) state.cast[1] = rollVessel(state.world, "force-v");
  renderCast();
  el("cast-count").textContent = state.cast.length + " bodies · seed " + state.world.seed;
  toast("Cast rolled");
}
function renderRite() {
  const s = state.lastRite; const box = el("rite-box");
  if (!s) { box.innerHTML = `<div class="card"><p class="invoice">Select a shaft in Cast to open the rite.</p></div>`; return; }
  box.innerHTML = shaftCard(s) + `<div class="card"><h2>Rite readout</h2><p class="grammar">${selfModel(s)}</p><p class="weather">${publicLine(s)}</p><p class="meta">If this body were unmarked Earth flesh, ${s.L} cm would sit near the ${fleshPercentile(s.L)}.</p><textarea class="json" readonly>${JSON.stringify(s, null, 2)}</textarea><div class="actions"><button class="act ghost" type="button" id="copy-rite">Copy JSON</button></div></div>`;
  el("copy-rite").onclick = () => { navigator.clipboard.writeText(JSON.stringify(s, null, 2)); toast("Copied"); };
}
function fleshPercentile(L) {
  const z = (L - VEALE.L_MEAN) / VEALE.L_SD;
  const p = 0.5 * (1 + erf(z / Math.SQRT2));
  if (p < 0.01) return "1st percentile or below";
  if (p > 0.99) return "99th percentile or beyond — Mark territory";
  return Math.round(p * 100) + "th mundane percentile";
}
function erf(x) {
  const s = Math.sign(x); const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a));
  return s * y;
}
function selfModel(s) {
  if (s.order === "Nub") return `${s.name} does not have a missing penis. They have a written refusal.`;
  if (s.order === "Modest") return `${s.name} budgets. Personality is the workaround they built.`;
  if (s.order === "Common") return `${s.name} can pass unmeasured until a tape appears.`;
  if (s.order === "Noted") return `${s.name} changes locker-room weather. Still Flesh-possible.`;
  if (s.order === "Claimant") return `${s.name} is past the Mark line. Invoice: ${s.invoice}`;
  return `${s.name} is ${s.order}. Invoice: ${s.invoice}`;
}
function publicLine(s) {
  return {
    secret: `${s.name}'s centimeters stay behind cloth unless they volunteer the tape.`,
    rumor: `Someone already has a number for ${s.name}.`,
    majority: `A majority rite put ${s.L} cm in a register.`,
    displayed: `Cut of clothes and walk advertise ${s.order}.`,
    aura: `The Measure precedes ${s.name}.`
  }[state.world.publicity];
}
function renderPair() {
  const box = el("pair-box");
  const shaft = state.cast.find((b) => b.type === "shaft" && state.selected.includes(b.id));
  const vessel = state.cast.find((b) => b.type === "vessel" && state.selected.includes(b.id));
  if (!shaft || !vessel) { box.innerHTML = `<div class="card"><p class="invoice">In Cast, tap one shaft and one vessel.</p></div>`; return; }
  const p = pair(shaft, vessel, state.world);
  box.innerHTML = `<div class="grid two">${shaftCard(shaft)}${vesselCard(vessel)}</div><div class="card"><h2>Pairing physics</h2><div class="ratio"><div class="box"><span class="meta">Fill F_L = L / D</span><b>${p.FL}</b><p class="grammar">${p.fill}</p></div><div class="box"><span class="meta">Stretch F_G = G / C</span><b>${p.FG}</b><p class="grammar">${p.stretch}</p></div></div><p class="weather">${p.social}</p></div>`;
}
function rollCensus() {
  readWorld();
  const n = 100;
  const counts = Object.fromEntries(ORDERS.map((o) => [o.id, 0]));
  let mark = 0, nubMark = 0;
  for (let i = 0; i < n; i++) {
    const s = rollShaft(state.world, "census-" + i + "-" + state.world.seed);
    counts[s.order]++; if (s.layer === "mark") mark++; if (s.order === "Nub") nubMark++;
  }
  const max = Math.max(...Object.values(counts), 1);
  el("census-box").innerHTML = `<div class="card"><h2>Census n=${n}</h2><p class="meta">${state.world.layerMix} · seed ${state.world.seed} · Mark ${mark}% · Nub ${nubMark}%</p><div class="bars">${ORDERS.map((o) => `<div class="r"><span>${o.id}</span><em><i style="width:${(counts[o.id] / max) * 100}%"></i></em><span>${counts[o.id]}</span></div>`).join("")}</div></div>`;
}
function toast(msg) {
  const t = el("toast"); t.textContent = msg; t.style.display = "block";
  clearTimeout(toast._id); toast._id = setTimeout(() => { t.style.display = "none"; }, 1400);
}
function bind() {
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  ["pub", "law", "mix", "inv", "seed"].forEach((id) => el(id).addEventListener("change", readWorld));
  el("btn-cast").onclick = () => { rollCast(8); setTab("cast"); };
  el("btn-cast2").onclick = () => rollCast(8);
  el("btn-one").onclick = () => { readWorld(); const s = rollShaft(state.world, "rite-" + Date.now()); state.lastRite = s; state.cast.unshift(s); renderCast(); renderRite(); setTab("rite"); };
  el("btn-census").onclick = () => { rollCensus(); setTab("census"); };
  el("btn-pair-hint").onclick = () => setTab("cast");
  renderCast(); renderPair(); renderRite();
}
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
document.addEventListener("DOMContentLoaded", bind);
