const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'client', 'public', 'images', 'characters');
fs.mkdirSync(OUT, { recursive: true });

const CHARS = {
  brick:    { cls: 'heavy', color: '#ff4444' },
  goliath:  { cls: 'heavy', color: '#cc44ff' },
  sniper:   { cls: 'zoner', color: '#44ff44' },
  wizard:   { cls: 'zoner', color: '#44ddff' },
  swift:    { cls: 'combo', color: '#ffff44' },
  shadow:   { cls: 'combo', color: '#8844ff' },
  blade:    { cls: 'sword', color: '#4488ff' },
  valkyrie: { cls: 'sword', color: '#ff8800' },
};

const STATES = ['idle', 'walk1', 'walk2', 'jump', 'shield'];

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<g fill="#ffffff">${body}</g></svg>`;
}

function hbuild(cls, state) {
  const w = 32, h = 48;
  let parts = [];
  if (state === 'shield') {
    parts.push(`<ellipse cx="16" cy="24" rx="15" ry="20" fill-opacity="0.3"/>`);
  }
  if (cls === 'heavy') {
    parts.push(`<circle cx="16" cy="10" r="8"/>`);
    parts.push(`<rect x="7" y="17" width="18" height="16" rx="2"/>`);
    if (state === 'idle' || state === 'shield') {
      parts.push(`<rect x="5" y="19" width="5" height="8" rx="2"/>`);
      parts.push(`<rect x="22" y="19" width="5" height="8" rx="2"/>`);
      parts.push(`<rect x="10" y="33" width="4" height="12" rx="1"/>`);
      parts.push(`<rect x="18" y="33" width="4" height="12" rx="1"/>`);
    } else if (state === 'walk1') {
      parts.push(`<rect x="4" y="20" width="5" height="7" rx="2"/>`);
      parts.push(`<rect x="23" y="18" width="5" height="9" rx="2"/>`);
      parts.push(`<rect x="9" y="33" width="4" height="14" rx="1"/>`);
      parts.push(`<rect x="19" y="33" width="4" height="10" rx="1"/>`);
    } else if (state === 'walk2') {
      parts.push(`<rect x="4" y="18" width="5" height="9" rx="2"/>`);
      parts.push(`<rect x="23" y="20" width="5" height="7" rx="2"/>`);
      parts.push(`<rect x="10" y="33" width="4" height="10" rx="1"/>`);
      parts.push(`<rect x="18" y="33" width="4" height="14" rx="1"/>`);
    } else if (state === 'jump') {
      parts.push(`<rect x="4" y="12" width="5" height="7" rx="2"/>`);
      parts.push(`<rect x="23" y="12" width="5" height="7" rx="2"/>`);
      parts.push(`<rect x="10" y="33" width="4" height="8" rx="1"/>`);
      parts.push(`<rect x="18" y="33" width="4" height="8" rx="1"/>`);
    }
  } else if (cls === 'zoner') {
    parts.push(`<circle cx="16" cy="9" r="6"/>`);
    parts.push(`<rect x="9" y="15" width="14" height="14" rx="2"/>`);
    if (state === 'idle' || state === 'shield') {
      parts.push(`<rect x="6" y="17" width="4" height="6" rx="1"/>`);
      parts.push(`<rect x="22" y="17" width="4" height="6" rx="1"/>`);
      parts.push(`<rect x="10" y="29" width="4" height="12" rx="1"/>`);
      parts.push(`<rect x="18" y="29" width="4" height="12" rx="1"/>`);
    } else if (state === 'walk1') {
      parts.push(`<rect x="5" y="19" width="4" height="5" rx="1"/>`);
      parts.push(`<rect x="23" y="17" width="4" height="7" rx="1"/>`);
      parts.push(`<rect x="9" y="29" width="4" height="14" rx="1"/>`);
      parts.push(`<rect x="19" y="29" width="4" height="10" rx="1"/>`);
    } else if (state === 'walk2') {
      parts.push(`<rect x="5" y="17" width="4" height="7" rx="1"/>`);
      parts.push(`<rect x="23" y="19" width="4" height="5" rx="1"/>`);
      parts.push(`<rect x="10" y="29" width="4" height="10" rx="1"/>`);
      parts.push(`<rect x="18" y="29" width="4" height="14" rx="1"/>`);
    } else if (state === 'jump') {
      parts.push(`<rect x="5" y="11" width="4" height="6" rx="1"/>`);
      parts.push(`<rect x="23" y="11" width="4" height="6" rx="1"/>`);
      parts.push(`<rect x="10" y="27" width="4" height="8" rx="1"/>`);
      parts.push(`<rect x="18" y="27" width="4" height="8" rx="1"/>`);
    }
    if (state !== 'jump') parts.push(`<rect x="24" y="12" width="5" height="6" rx="1"/>`);
    else parts.push(`<rect x="24" y="12" width="5" height="6" rx="1"/>`);
  } else if (cls === 'combo') {
    parts.push(`<circle cx="16" cy="10" r="6"/>`);
    parts.push(`<rect x="10" y="16" width="12" height="12" rx="2"/>`);
    if (state === 'idle' || state === 'shield') {
      parts.push(`<rect x="6" y="18" width="5" height="5" rx="1"/>`);
      parts.push(`<rect x="21" y="18" width="5" height="5" rx="1"/>`);
      parts.push(`<rect x="11" y="28" width="4" height="14" rx="1"/>`);
      parts.push(`<rect x="17" y="28" width="4" height="14" rx="1"/>`);
    } else if (state === 'walk1') {
      parts.push(`<rect x="5" y="20" width="5" height="4" rx="1"/>`);
      parts.push(`<rect x="22" y="17" width="5" height="7" rx="1"/>`);
      parts.push(`<rect x="10" y="28" width="4" height="15" rx="1"/>`);
      parts.push(`<rect x="18" y="28" width="4" height="11" rx="1"/>`);
    } else if (state === 'walk2') {
      parts.push(`<rect x="5" y="17" width="5" height="7" rx="1"/>`);
      parts.push(`<rect x="22" y="20" width="5" height="4" rx="1"/>`);
      parts.push(`<rect x="11" y="28" width="4" height="11" rx="1"/>`);
      parts.push(`<rect x="17" y="28" width="4" height="15" rx="1"/>`);
    } else if (state === 'jump') {
      parts.push(`<rect x="5" y="12" width="5" height="6" rx="1"/>`);
      parts.push(`<rect x="22" y="12" width="5" height="6" rx="1"/>`);
      parts.push(`<rect x="11" y="27" width="4" height="8" rx="1"/>`);
      parts.push(`<rect x="17" y="27" width="4" height="8" rx="1"/>`);
    }
  } else if (cls === 'sword') {
    parts.push(`<rect x="12" y="2" width="8" height="8" rx="2"/>`);
    parts.push(`<circle cx="16" cy="8" r="5"/>`);
    parts.push(`<rect x="10" y="14" width="12" height="14" rx="2"/>`);
    if (state === 'idle' || state === 'shield') {
      parts.push(`<rect x="7" y="16" width="4" height="6" rx="1"/>`);
      parts.push(`<rect x="21" y="16" width="4" height="6" rx="1"/>`);
      parts.push(`<rect x="11" y="28" width="4" height="13" rx="1"/>`);
      parts.push(`<rect x="17" y="28" width="4" height="13" rx="1"/>`);
    } else if (state === 'walk1') {
      parts.push(`<rect x="6" y="18" width="4" height="5" rx="1"/>`);
      parts.push(`<rect x="22" y="16" width="4" height="7" rx="1"/>`);
      parts.push(`<rect x="10" y="28" width="4" height="15" rx="1"/>`);
      parts.push(`<rect x="18" y="28" width="4" height="11" rx="1"/>`);
    } else if (state === 'walk2') {
      parts.push(`<rect x="6" y="16" width="4" height="7" rx="1"/>`);
      parts.push(`<rect x="22" y="18" width="4" height="5" rx="1"/>`);
      parts.push(`<rect x="11" y="28" width="4" height="11" rx="1"/>`);
      parts.push(`<rect x="17" y="28" width="4" height="15" rx="1"/>`);
    } else if (state === 'jump') {
      parts.push(`<rect x="6" y="11" width="4" height="6" rx="1"/>`);
      parts.push(`<rect x="22" y="11" width="4" height="6" rx="1"/>`);
      parts.push(`<rect x="11" y="27" width="4" height="9" rx="1"/>`);
      parts.push(`<rect x="17" y="27" width="4" height="9" rx="1"/>`);
    }
    if (state !== 'jump') parts.push(`<rect x="24" y="10" width="4" height="20" rx="1"/>`);
    else parts.push(`<rect x="24" y="10" width="4" height="20" rx="1"/>`);
  }
  return svg(w, h, parts.join('\n'));
}

for (const [name, info] of Object.entries(CHARS)) {
  for (const state of STATES) {
    const file = path.join(OUT, `${name}_${state}.png`);
    if (!fs.existsSync(file)) {
      const content = hbuild(info.cls, state);
      fs.writeFileSync(path.join(OUT, `${name}_${state}.svg`), content);
      console.log(`  Generated ${name}_${state}.svg`);
    } else {
      console.log(`  Skipped ${name}_${state}.png (exists)`);
    }
  }
}
console.log('Done!');
