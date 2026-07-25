/**
 * Generates the SVGs used by the profile README into .github/assets.
 *
 *   node scripts/generate-assets.mjs
 *
 * Only the banner and the small link chips are images. Everything else in the
 * README is real markdown on purpose: selectable, searchable by GitHub, and
 * readable without rendering anything.
 *
 * Nothing is fetched at runtime, so the profile cannot break because someone
 * else's server went away.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.github', 'assets');

const C = {
  bg1: '#0A0C11', bg2: '#141A24', panel: '#12161E',
  straw: '#E3A93C', band: '#C7384F', mint: '#33C9A7',
  cream: '#F3EDE1', muted: '#8C93A1',
};

const SUB = 'mico · building tools, games and systems';

/* ---------------------------------------------------------------- banner -- */

// Deterministic so regenerating doesn't reshuffle the sky on every run.
function stars(n) {
  let s = 20240425;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(rnd() * 1200), y = Math.round(rnd() * 300);
    if (x > 120 && x < 400 && y > 60 && y < 260) continue; // keep the hat clear
    out.push(`<circle cx="${x}" cy="${y}" r="${(rnd() * 1.5 + .7).toFixed(1)}" fill="${C.cream}" opacity="${(rnd() * .5 + .18).toFixed(2)}" />`);
  }
  return out.join('');
}

const CROWN = 'M181 196 C181 106 209 82 251 82 C293 82 321 106 321 196 Z';

const banner = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 330" width="1200" height="330" role="img" aria-label="strohut — mico, building tools, games and systems">
  <title>strohut</title>
  <defs>
    <linearGradient id="night" x1="0" y1="0" x2=".35" y2="1">
      <stop offset="0%" stop-color="${C.bg1}" /><stop offset="100%" stop-color="${C.bg2}" />
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5">
      <stop offset="0%" stop-color="${C.straw}" stop-opacity=".42" />
      <stop offset="60%" stop-color="${C.band}" stop-opacity=".12" />
      <stop offset="100%" stop-color="${C.straw}" stop-opacity="0" />
    </radialGradient>
    <clipPath id="card"><rect width="1200" height="330" rx="26" /></clipPath>
    <clipPath id="crown"><path d="${CROWN}" /></clipPath>
    <pattern id="halftone" width="17" height="17" patternUnits="userSpaceOnUse">
      <circle cx="3.5" cy="3.5" r="2.2" fill="${C.straw}" />
    </pattern>
    <radialGradient id="fadeR" cx=".5" cy=".5" r=".5">
      <stop offset="0%" stop-color="#fff" /><stop offset="100%" stop-color="#fff" stop-opacity="0" />
    </radialGradient>
    <mask id="dotFade"><rect x="880" y="10" width="320" height="310" fill="url(#fadeR)" /></mask>
  </defs>
  <style>
    .wm  { fill: ${C.cream}; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
           font-size: 104px; font-weight: 800; letter-spacing: -4px; }
    .sub { fill: ${C.muted}; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
           font-size: 17px; letter-spacing: 2.6px; }
    @media (prefers-reduced-motion: no-preference) {
      .rise { animation: rise 1.1s cubic-bezier(.16,.84,.44,1) both }
      .in1  { animation: fin .8s cubic-bezier(.16,.84,.44,1) .22s both }
      .in2  { animation: fin .8s cubic-bezier(.16,.84,.44,1) .38s both }
      .tw   { animation: tw 4s ease-in-out infinite alternate }
      @keyframes rise { from { transform: translateY(30px); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes fin  { from { transform: translateY(12px); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes tw   { from { opacity: .45 } to { opacity: 1 } }
    }
  </style>
  <g clip-path="url(#card)">
    <rect width="1200" height="330" fill="url(#night)" />
    <g class="tw">${stars(70)}</g>
    <rect x="880" y="10" width="320" height="310" fill="url(#halftone)" opacity=".16" mask="url(#dotFade)" />
    <circle class="rise" cx="251" cy="172" r="185" fill="url(#glow)" />
    <g fill="${C.cream}" opacity=".12">
      <rect x="0" y="258" width="1200" height="2.5" rx="1.25" />
      <rect x="0" y="277" width="1200" height="1.8" rx="1" />
    </g>
    <g class="in1">
      <path d="${CROWN}" fill="${C.straw}" />
      <ellipse cx="251" cy="196" rx="136" ry="29" fill="${C.straw}" />
      <g clip-path="url(#crown)"><path d="M170 170 C200 186 302 186 332 170" stroke="${C.band}" stroke-width="26" fill="none" /></g>
      <circle cx="315" cy="176" r="7.5" fill="${C.mint}" />
    </g>
    <g class="in2">
      <text class="wm" x="450" y="182">strohut<tspan fill="${C.straw}">.</tspan></text>
      <rect x="456" y="208" width="188" height="5" rx="2.5" fill="${C.band}" />
      <text class="sub" x="457" y="246">${SUB}</text>
    </g>
  </g>
</svg>
`;

/* ------------------------------------------------------------ link chips -- */

const chip = (label, color) => {
  const FS = 16, PADX = 17, H = 38;
  const w = Math.round(label.length * FS * 0.601 + PADX * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${H}" width="${w}" height="${H}" role="img" aria-label="${label}">
  <title>${label}</title>
  <rect x=".9" y=".9" width="${w - 1.8}" height="${H - 1.8}" rx="${H / 2}" fill="${C.panel}" stroke="${color}" stroke-opacity=".55" stroke-width="1.8" />
  <text x="${w / 2}" y="${H / 2 + 5.5}" text-anchor="middle" fill="${color}"
    font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="${FS}" font-weight="600">${label}</text>
</svg>
`;
};

const LINKS = [
  ['x', '#C9D1DE'],
  ['mail', '#5BC8A8'],
];

/* Tiny accent dots for the project boxes. Purely decorative (alt=""), so the
   heading text next to them stays the real, readable content. */
const dot = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" role="presentation">
  <circle cx="6" cy="6" r="5" fill="${color}" />
</svg>
`;

const DOTS = [
  ['centauri', C.straw],
  ['bitjjk', C.band],
  ['sonitor', C.mint],
];

/* ------------------------------------------------------------------ run --- */

fs.mkdirSync(OUT, { recursive: true });

const written = [];
const write = (name, body) => { fs.writeFileSync(path.join(OUT, name), body); written.push(name); };

write('banner.svg', banner());
for (const [label, color] of LINKS) write(`link-${label}.svg`, chip(label, color));
for (const [name, color] of DOTS) write(`dot-${name}.svg`, dot(color));

console.log(`${written.length} files -> ${path.relative(ROOT, OUT)}`);
for (const f of written) console.log('  ' + f);
