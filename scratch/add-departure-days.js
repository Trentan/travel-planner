// Script to add departure day cards to origin cities
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./backups/2026_June_July_Europe_Thailand.json', 'utf8'));

// Helper to create a departure day card
function createDepartureDay({ date, day, from, to, desc, headline, cityId }) {
  return {
    date,
    day,
    from,
    to,
    accom: '— (departure day)',
    desc,
    headline,
    completed: false,
    accomCost: '0',
    activityCost: '0',
    accomItems: [{
      text: '— (departure day)',
      cost: '0',
      status: 'pending',
      bookingRef: '',
      cityId
    }],
    activityItems: []
  };
}

// Vienna: Add 2026-06-11 departure day to Vienna leg
const viennaLeg = data.itinerary.find(l => l.id === 'vienna');
viennaLeg.days.push(createDepartureDay({
  date: '2026-06-11',
  day: 'Thu',
  from: 'Vienna',
  to: 'Bratislava',
  desc: 'Departure to Bratislava',
  headline: 'Pack up → Prepare for train to Bratislava',
  cityId: viennaLeg.days[0].accomItems[0].cityId
}));

// Bratislava: Add 2026-06-13 departure day to Bratislava leg
const bratislavaLeg = data.itinerary.find(l => l.id === 'bratislava');
bratislavaLeg.days.push(createDepartureDay({
  date: '2026-06-13',
  day: 'Sat',
  from: 'Bratislava',
  to: 'Prague',
  desc: 'Departure to Prague',
  headline: 'Pack up → Travel to Prague',
  cityId: bratislavaLeg.days[0].accomItems[0].cityId
}));

// Prague: Add 2026-06-15 departure day to Prague leg
const pragueLeg = data.itinerary.find(l => l.id === 'prague');
pragueLeg.days.push(createDepartureDay({
  date: '2026-06-15',
  day: 'Mon',
  from: 'Prague',
  to: 'Nuremberg',
  desc: 'Departure to Nuremberg',
  headline: 'Pack up → Travel to Nuremberg',
  cityId: pragueLeg.days[0].accomItems[0].cityId
}));

// Nuremberg: Add 2026-06-16 departure day to Nuremberg leg
const nurembergLeg = data.itinerary.find(l => l.id === 'nuremberg');
nurembergLeg.days.push(createDepartureDay({
  date: '2026-06-16',
  day: 'Tue',
  from: 'Nuremberg',
  to: 'Munich',
  desc: 'Departure to Munich',
  headline: 'Pack up → Travel to Munich for conference',
  cityId: nurembergLeg.days[0].accomItems[0].cityId
}));

// Milan: Add 2026-06-25 departure day to Milan leg
const milanLeg = data.itinerary.find(l => l.id === 'milan');
milanLeg.days.push(createDepartureDay({
  date: '2026-06-25',
  day: 'Thu',
  from: 'Milan',
  to: 'Zurich',
  desc: 'Departure to Zurich',
  headline: 'Pack up → Morning train to Zurich',
  cityId: milanLeg.days[0].accomItems[0].cityId
}));

// Koh Samui: Add 2026-07-07 departure day to Koh Samui leg
const samuiLeg = data.itinerary.find(l => l.id === 'samui');
samuiLeg.days.push(createDepartureDay({
  date: '2026-07-07',
  day: 'Tue',
  from: 'Koh Samui',
  to: 'Bangkok',
  desc: 'Departure from Samui',
  headline: '🛫 Early checkout → Flight to Bangkok',
  cityId: samuiLeg.days[0].accomItems[0].cityId
}));

// Write the updated file
fs.writeFileSync('./backups/2026_June_July_Europe_Thailand.json', JSON.stringify(data, null, 2));

console.log('Updated backup file with departure day cards:');
data.itinerary.forEach(leg => {
  console.log(`  ${leg.label}: ${leg.days.map(d => d.date).join(', ')}`);
});