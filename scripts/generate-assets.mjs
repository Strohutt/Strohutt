/**
 * Generates every SVG used by the profile README into .github/assets.
 *
 *   node scripts/generate-assets.mjs
 *
 * Nothing here is fetched at runtime — the README depends on no third-party
 * service, so the profile cannot break because someone else's server went away.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.github', 'assets');

const C = {
  bg1: '#0A0C11', bg2: '#141A24', panel: '#12161E', edge: '#242C3A',
  straw: '#E3A93C', band: '#C7384F', mint: '#33C9A7',
  cream: '#F3EDE1', muted: '#8C93A1',
};

const SUB = 'mico · frontend';
const MAXW = 840;

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

const banner = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 330" width="1200" height="330" role="img" aria-label="strohut">
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
           font-size: 19px; letter-spacing: 4px; }
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

/* ----------------------------------------------------------------- chips -- */

const CHIP = { FS: 16, PADX: 17, H: 38, GAP: 10, VGAP: 10 };
const chipWidth = (label) => Math.round(label.length * CHIP.FS * 0.601 + CHIP.PADX * 2);

const chipBody = (label, color, x, y) => `<rect x="${x + .9}" y="${y + .9}" width="${chipWidth(label) - 1.8}" height="${CHIP.H - 1.8}" rx="${CHIP.H / 2}" fill="${C.panel}" stroke="${color}" stroke-opacity=".55" stroke-width="1.8" />
    <text x="${x + chipWidth(label) / 2}" y="${y + CHIP.H / 2 + 5.5}" text-anchor="middle" fill="${color}"
      font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="${CHIP.FS}" font-weight="600">${label}</text>`;

/** One standalone chip — used for the link badges, so each can carry its own href. */
const chip = (label, color) => {
  const w = chipWidth(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${CHIP.H}" width="${w}" height="${CHIP.H}" role="img" aria-label="${label}">
  <title>${label}</title>
  ${chipBody(label, color, 0, 0)}
</svg>
`;
};

/** Many chips, wrapped into rows at maxW. */
const chipRows = (items, maxW = MAXW) => {
  let x = 0, y = 0, widest = 0;
  const parts = items.map(([label, color], i) => {
    const w = chipWidth(label);
    if (x > 0 && x + w > maxW) { widest = Math.max(widest, x - CHIP.GAP); x = 0; y += CHIP.H + CHIP.VGAP; }
    const g = `<g class="c" style="--i:${i}">
    ${chipBody(label, color, x, y)}
  </g>`;
    x += w + CHIP.GAP;
    return g;
  });
  widest = Math.max(widest, x - CHIP.GAP);
  const totalH = y + CHIP.H;
  const names = items.map((t) => t[0]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widest} ${totalH}" width="${widest}" height="${totalH}" role="img" aria-label="${names.join(', ')}">
  <title>${names.join(' · ')}</title>
  <style>@media (prefers-reduced-motion: no-preference){
    .c{animation:pop .5s cubic-bezier(.2,.9,.3,1.15) both;animation-delay:calc(var(--i)*.05s)}
    @keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}</style>
  ${parts.join('\n  ')}
</svg>
`;
};

/* ---------------------------------------------------------- project card -- */

const card = ({ name, lines, tags, accent }) => {
  const W = MAXW, TOP = 40, LEAD = 23;
  const tagY = TOP + 22 + lines.length * LEAD;
  const H = tagY + 40;
  let tx = 26;
  const tagEls = tags.map(([t, col]) => {
    const w = Math.round(t.length * 8.1 + 22);
    const g = `<g><rect x="${tx}" y="${tagY}" width="${w}" height="24" rx="12" fill="${col}" fill-opacity=".13" stroke="${col}" stroke-opacity=".45" />
    <text x="${tx + w / 2}" y="${tagY + 16.5}" text-anchor="middle" fill="${col}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="600">${t}</text></g>`;
    tx += w + 8;
    return g;
  }).join('');
  const lineEls = lines.map((l, i) =>
    `<text x="26" y="${TOP + 27 + i * LEAD}" fill="${i === 0 ? C.cream : C.muted}" fill-opacity="${i === 0 ? .92 : 1}"
      font-family="Inter, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" font-size="14.5">${l}</text>`).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${name}">
  <title>${name}</title>
  <rect x=".8" y=".8" width="${W - 1.6}" height="${H - 1.6}" rx="14" fill="${C.panel}" stroke="${C.edge}" stroke-width="1.6" />
  <rect x="1" y="1" width="5" height="${H - 2}" rx="2.5" fill="${accent}" />
  <text x="26" y="${TOP}" fill="${C.cream}" font-family="Inter, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" font-size="21" font-weight="700" letter-spacing=".3">${name}</text>
  ${lineEls}
  ${tagEls}
</svg>
`;
};

/* ------------------------------------------------------------- content --- */

const STACK = [
  ['TypeScript', '#6BA5E8'], ['JavaScript', '#E8CF52'], ['Python', '#6BA3D6'], ['Luau', '#4FB8F0'],
  ['React', '#61DAFB'], ['Tailwind', '#38BDF8'], ['HTML', '#E8734A'], ['CSS', '#5B8DEF'],
  ['Docker', '#4A9BE8'], ['MySQL', '#E8A33D'], ['Git', '#E8674A'], ['Figma', '#C77DFF'], ['Blender', '#F0913F'],
];

const LINKS = [
  ['youtube', '#E86A6A'],
  ['x', '#C9D1DE'],
  ['mail', '#5BC8A8'],
];

const PROJECTS = [
  {
    file: 'p-bitjjk.svg', accent: C.band, name: 'BITJJK',
    lines: [
      'A text-based Jujutsu Kaisen life sim. Born human, awaken to cursed energy, climb the grades.',
      'Or turn, and become the thing they hunt. Every run ends in an obituary — then the next generation begins.',
    ],
    tags: [['TypeScript', '#6BA5E8'], ['React', '#61DAFB'], ['Zustand', '#E8A33D'], ['PWA', '#33C9A7'], ['offline', '#8C93A1']],
  },
  {
    file: 'p-centauri.svg', accent: C.straw, name: 'Centauri',
    lines: [
      'A control plane for everything I build — tasks, decisions, audit trails, full execution traces.',
      'Passkeys, 2FA, and a knowledge layer that still remembers what happened three weeks ago.',
    ],
    tags: [['React', '#61DAFB'], ['Vite', '#C77DFF'], ['Tailwind', '#38BDF8'], ['Node', '#6BC96B'], ['SQLite', '#6BA5E8']],
  },
  {
    file: 'p-guild.svg', accent: C.mint, name: 'Revolution Guild',
    lines: [
      'A Discord bot running an entire server economy — jobs, crafting, fishing, casino, crates.',
      'Levels, leaderboards, patched exploits, and a React dashboard sitting on top of all of it.',
    ],
    tags: [['Python', '#6BA3D6'], ['py-cord', '#8C93A1'], ['SQLite', '#6BA5E8'], ['React', '#61DAFB'], ['Pillow', '#C77DFF']],
  },
];

/* ------------------------------------------------------------------ run --- */

fs.mkdirSync(OUT, { recursive: true });

const written = [];
const write = (name, body) => { fs.writeFileSync(path.join(OUT, name), body); written.push(name); };

write('banner.svg', banner());
write('stack.svg', chipRows(STACK));
for (const [label, color] of LINKS) write(`link-${label}.svg`, chip(label, color));
for (const p of PROJECTS) write(p.file, card(p));

console.log(`${written.length} files -> ${path.relative(ROOT, OUT)}`);
for (const f of written) console.log('  ' + f);
