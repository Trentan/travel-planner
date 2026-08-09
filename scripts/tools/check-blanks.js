const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backups/europe-2027-itinerary.json', 'utf8'));

let blanks = 0;
data.itinerary.forEach((leg, i) => {
  leg.days.forEach((day, j) => {
    (day.activityItems || []).forEach(a => {
      if (!a.title || a.title.trim() === '') {
        console.log(`Leg ${i} Day ${j} blank activity:`, a);
        blanks++;
      }
    });
  });
});
console.log("Total blank activityItems in days:", blanks);
