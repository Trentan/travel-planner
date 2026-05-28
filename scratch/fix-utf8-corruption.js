const fs = require('fs');
const path = 'js/itinerary.js';

const content = fs.readFileSync(path, 'utf8');

// Map Windows-1252/Unicode characters back to raw bytes
const unicodeToByte = {
  8218: 130, // ‚
  402: 131,  // ƒ
  8222: 132, // „
  8230: 133, // …
  8224: 134, // †
  8225: 135, // ‡
  710: 136,  // ˆ
  8240: 137, // ‰
  352: 138,  // Š
  8249: 139, // ‹
  338: 140,  // Œ
  814: 141,  // control char
  815: 142,  // control char
  816: 143,  // control char
  817: 144,  // control char
  8216: 145, // ‘
  8217: 146, // ’
  8220: 147, // “
  8221: 148, // ”
  8226: 149, // •
  8211: 150, // –
  8212: 151, // —
  732: 152,  // ˜
  8482: 153, // ™
  353: 154,  // š
  8250: 155, // ›
  339: 156,  // œ
  818: 157,  // control char
  819: 158,  // control char
  376: 159   // Ÿ
};

// Fill in other controls if they appear (e.g. 141, 143)
for (let i = 128; i < 160; i++) {
  if (!Object.values(unicodeToByte).includes(i)) {
    // If there are other control character mappings
  }
}

const bytes = [];
for (let i = 0; i < content.length; i++) {
  const code = content.charCodeAt(i);
  if (unicodeToByte[code] !== undefined) {
    bytes.push(unicodeToByte[code]);
  } else if (code === 141) {
    bytes.push(141);
  } else if (code === 143) {
    bytes.push(143);
  } else if (code === 157) {
    bytes.push(157);
  } else if (code < 256) {
    bytes.push(code);
  } else {
    // Keep character as UTF-8 bytes if it's already a valid non-latin1 high character
    const buf = Buffer.from(content[i], 'utf8');
    for (const b of buf) {
      bytes.push(b);
    }
  }
}

const decoded = Buffer.from(bytes).toString('utf8');
fs.writeFileSync(path, decoded, 'utf8');
console.log('Successfully repaired file emojis and symbols!');
