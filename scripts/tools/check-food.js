const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backups/europe-2027-itinerary.json', 'utf8'));

let count = 0;
data.itinerary.forEach((leg, i) => {
  if (leg.cityFood && leg.cityFood.length > 0) {
    console.log(`Leg ${i} cityFood:`, leg.cityFood);
    count += leg.cityFood.length;
  }
});
console.log('Total cityFood items:', count);
