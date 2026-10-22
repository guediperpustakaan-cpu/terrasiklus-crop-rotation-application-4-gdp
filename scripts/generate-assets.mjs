import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const outputDir = "public/images";

const svg = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;

function leaf(x, y, scale, rotation, color, opacity = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})" opacity="${opacity}">
    <path d="M0 0 C 26 -12 40 -40 34 -66 C 14 -58 -2 -30 0 0 Z" fill="${color}"/>
    <path d="M2 -4 C 18 -22 26 -42 30 -60" stroke="rgba(255,255,255,0.28)" stroke-width="2" fill="none"/>
  </g>`;
}

function hero() {
  const rows = [];
  for (let row = 0; row < 5; row++) {
    const y = 470 + row * 68;
    const spread = 120 + row * 150;
    const size = 1.5 + row * 0.55;
    const opacity = 0.55 + row * 0.11;
    let plants = "";
    for (let i = -6; i <= 6; i++) {
      const x = 600 + i * spread * 0.42;
      plants += leaf(
        x,
        y,
        size,
        i * 3 + (row % 2 ? 6 : -6),
        "#3f7a45",
        opacity,
      );
      plants += leaf(
        x + 6,
        y - 4,
        size * 0.72,
        i * 3 + 160,
        "#66a15a",
        opacity,
      );
    }
    rows.push(
      `<path d="M0 ${y + 14} Q 600 ${y - 16} 1200 ${y + 6} L1200 ${y + 58} Q 600 ${y + 34} 0 ${y + 66} Z" fill="#3a2f23" opacity="0.5"/>`,
      plants,
    );
  }
  return svg(
    1200,
    800,
    `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#dff0e2"/>
        <stop offset="55%" stop-color="#bcdcc4"/>
        <stop offset="100%" stop-color="#8fbd97"/>
      </linearGradient>
      <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="#fff6d8" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#fff6d8" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6b5136"/>
        <stop offset="100%" stop-color="#3f3122"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#sky)"/>
    <circle cx="905" cy="185" r="230" fill="url(#sun)"/>
    <circle cx="905" cy="185" r="62" fill="#fdf3d2" opacity="0.92"/>
    <path d="M0 330 Q 190 268 380 322 T 760 300 T 1200 342 L1200 470 L0 470 Z" fill="#6ea87a" opacity="0.55"/>
    <path d="M0 396 Q 240 344 470 392 T 900 368 T 1200 402 L1200 470 L0 470 Z" fill="#4f8c5c" opacity="0.5"/>
    <rect x="0" y="462" width="1200" height="338" fill="url(#ground)"/>
    ${rows.join("")}
    <rect x="0" y="0" width="1200" height="800" fill="#1f4a2c" opacity="0.08"/>`,
  );
}

function garden() {
  const beds = [];
  for (let i = 0; i < 3; i++) {
    const y = 250 + i * 130;
    beds.push(
      `<rect x="${120 + i * 40}" y="${y}" width="${960 - i * 80}" height="88" rx="18" fill="#7a5c3c" opacity="0.85"/>`,
    );
    for (let j = 0; j < 7 - i; j++) {
      const x = 180 + i * 40 + j * (120 - i * 12);
      beds.push(leaf(x, y + 78, 0.62 + i * 0.12, -12 + j * 5, "#357a3f"));
      beds.push(leaf(x + 14, y + 78, 0.5 + i * 0.1, 22 + j * 4, "#5f9c50"));
    }
  }
  return svg(
    800,
    600,
    `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e7f2e6"/>
        <stop offset="100%" stop-color="#a9c9a6"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <circle cx="660" cy="110" r="70" fill="#f6f0cf" opacity="0.8"/>
    ${beds.join("")}
    <path d="M0 470 Q 200 440 400 476 T 800 462 L800 600 L0 600 Z" fill="#8a6a46" opacity="0.6"/>`,
  );
}

function tomato() {
  const fruits = [
    [250, 300, 74],
    [400, 250, 88],
    [545, 320, 68],
    [330, 410, 62],
    [500, 430, 56],
  ]
    .map(
      ([cx, cy, r]) =>
        `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#c9402f"/>
         <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.32}" r="${r * 0.55}" fill="#e0654c" opacity="0.75"/>
         <path d="M${cx - r * 0.5} ${cy - r * 0.85} l${r * 0.35} ${r * 0.35} l${r * 0.2} ${-r * 0.45} l${r * 0.2} ${r * 0.45} l${r * 0.35} ${-r * 0.35} z" fill="#3f7a3c"/></g>`,
    )
    .join("");
  return svg(
    800,
    600,
    `<defs>
      <linearGradient id="tb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#274a2c"/>
        <stop offset="100%" stop-color="#4a7a44"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#tb)"/>
    ${leaf(90, 560, 2.6, -18, "#2f6435")}
    ${leaf(710, 580, 2.4, 26, "#356f39")}
    <path d="M0 150 Q 200 210 400 168 T 800 196" stroke="#356f39" stroke-width="12" fill="none"/>
    <path d="M120 190 L160 320 M520 185 L470 350" stroke="#3f7a3c" stroke-width="9" fill="none"/>
    ${fruits}`,
  );
}

function pakcoy() {
  const heads = [
    [230, 380, 1],
    [420, 330, 1.18],
    [600, 400, 0.92],
  ]
    .map(
      ([cx, cy, s]) =>
        `<g transform="translate(${cx} ${cy}) scale(${s})">
          <path d="M-62 40 C -66 -60 -22 -96 0 -96 C 22 -96 66 -60 62 40 Z" fill="#eef3d8"/>
          <path d="M-50 -10 C -34 -46 -12 -62 0 -62 C 12 -62 34 -46 50 -10" stroke="#c3d4a0" stroke-width="5" fill="none"/>
          ${leaf(-30, -62, 0.62, -34, "#3f8a41")}
          ${leaf(30, -62, 0.62, 34, "#4d9a49")}
          ${leaf(0, -74, 0.72, 2, "#2f7a38")}
        </g>`,
    )
    .join("");
  return svg(
    800,
    600,
    `<defs>
      <linearGradient id="pb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f2f7e9"/>
        <stop offset="100%" stop-color="#cfe0bb"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#pb)"/>
    <path d="M0 500 Q 200 470 400 506 T 800 486 L800 600 L0 600 Z" fill="#9a7a53" opacity="0.65"/>
    ${heads}`,
  );
}

function carrot() {
  const carrots = [
    [240, 300, 1, -16],
    [420, 250, 1.15, 4],
    [590, 320, 0.92, 18],
  ]
    .map(
      ([cx, cy, s, r]) =>
        `<g transform="translate(${cx} ${cy}) rotate(${r}) scale(${s})">
          <path d="M-40 0 L40 0 L4 190 Z" fill="#e07f2b"/>
          <path d="M-30 -6 L-14 120" stroke="#f0a css" stroke-width="0" fill="none"/>
          <path d="M-24 -2 L-6 118" stroke="#f2a css" stroke-width="0" fill="none"/>
          <path d="M-26 -4 L-10 122" stroke="#f4a45a" stroke-width="7" stroke-linecap="round" fill="none"/>
          <path d="M22 -4 L8 100" stroke="#f4a45a" stroke-width="7" stroke-linecap="round" fill="none"/>
          ${leaf(-18, -6, 0.5, -26, "#3f8a41")}
          ${leaf(18, -6, 0.5, 26, "#4d9a49")}
          ${leaf(0, -10, 0.56, 0, "#2f7a38")}
        </g>`,
    )
    .join("");
  return svg(
    800,
    600,
    `<defs>
      <linearGradient id="cb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f6ead8"/>
        <stop offset="100%" stop-color="#d9bd97"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#cb)"/>
    <path d="M0 420 Q 200 392 400 428 T 800 406 L800 600 L0 600 Z" fill="#a97f52" opacity="0.7"/>
    ${carrots}`,
  );
}

const targets = [
  ["hero.jpg", hero(), 1200, 800],
  ["garden.jpg", garden(), 800, 600],
  ["tomato.jpg", tomato(), 800, 600],
  ["pakcoy.jpg", pakcoy(), 800, 600],
  ["carrot.jpg", carrot(), 800, 600],
];

await mkdir(outputDir, { recursive: true });
for (const [name, markup, width, height] of targets) {
  await sharp(Buffer.from(markup))
    .resize(width, height)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${outputDir}/${name}`);
  console.log(`generated ${outputDir}/${name}`);
}
