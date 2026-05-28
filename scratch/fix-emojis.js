const fs = require('fs');
const path = 'js/itinerary.js';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['ðŸ ½ï¸ ', '🍽️'],
  ['ðŸ ½ï¸', '🍽️'],
  ['ðŸ“ ', '📌'],
  ['ðŸ“', '📌'],
  ['ðŸ ƒ', '🏃'],
  ['ðŸ ›ï¸ ', '🏛️'],
  ['ðŸ ›ï¸', '🏛️'],
  ['ðŸŽ¢', '🎢'],
  ['ðŸ§˜', '🧘'],
  ['ðŸšŒ', '🚌'],
  ['ðŸ —', '🍳'],
  ['ðŸ ¨', '🏨'],
  ['ðŸšª', '🚪'],
  ['ðŸ’¬', '💬'],
  ['ðŸŽ‰', '🎉'],
  ['ðŸ—‘', '🗑️'],
  ['ðŸ’¡', '💡'],
  ['ðŸ ”', '🍔'],
  ['ðŸ“Œ', '📌'],
  ['ðŸ ™ï¸ ', '🗺️'],
  ['ðŸ ™ï¸', '🗺️']
];

for (const [pattern, replacement] of replacements) {
  content = content.split(pattern).join(replacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully fixed all literal emojis!');
