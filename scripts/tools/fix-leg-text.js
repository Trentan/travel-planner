const fs = require('fs');
const filepath = 'backups/europe-2027-itinerary.json';
const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

let count = 0;
data.itinerary.forEach(leg => {
  (leg.cityFood || []).forEach(f => {
    if (f.title && !f.text) {
      f.text = f.title;
      count++;
    }
  });
  
  (leg.suggestedActivities || []).forEach(a => {
    if (a.title && !a.text) {
      a.text = a.title;
      count++;
    }
  });
});

fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
console.log('Migrated', count, 'leg-level items to use .text instead of .title');
