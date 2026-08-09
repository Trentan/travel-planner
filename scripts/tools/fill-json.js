const fs = require('fs');
const filepath = 'backups/europe-2027-itinerary.json';
const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

const titleMap = {
  "Skip-the-line combined ticket; go early morning for softer light and thinner crowds": "Colosseum & Roman Forum",
  "Pre-booked timed entry avoids multi-hour queues": "Vatican Museums & Sistine Chapel",
  "~1h30 direct, Roma Termini to Firenze Santa Maria Novella": "High-Speed Train: Rome to Florence",
  "Home to the Renaissance's greatest hits — Botticelli, Michelangelo, Da Vinci": "Uffizi Gallery",
  "~2 hours direct, Firenze SMN to Venezia Santa Lucia": "High-Speed Train: Florence to Venice",
  "Late afternoon light is best for photos, and rates are fixed by the city": "Classic Gondola Ride",
  "House cava, anchovies and classic tapas in a century-old bar": "La Plata Tapas Bar",
  "Allow 1.5-2 hours; the stained-glass light inside is best in late morning": "Sagrada Familia",
  "Easy flat walk along the promenade with a swim stop if the weather's warm": "Barceloneta Beach Promenade",
  "~2h30 direct, Barcelona Sants to Madrid Atocha": "High-Speed Train: Barcelona to Madrid",
  "Allow at least 2-3 hours; Las Meninas is the must-see": "Prado Museum",
  "Wide gravel paths circle the lake — a shaded, flat loop before the day heats up": "Retiro Park Morning Stroll",
  "Warm from the oven with a dusting of cinnamon — the original since 1837": "Pastéis de Belém",
  "16th-century fortress and monastery marking Portugal's Age of Discovery": "Jerónimos Monastery",
  "Flat waterfront path past Praça do Comércio, good for an easy morning walk with river views": "Ribeira das Naus Walk",
  "Reserve ahead; save room for the famous chocolate mousse served straight from the bowl": "Chez Janou Bistro Dinner",
  "Pre-booked timed entry; sunset ascent gives Paris lit up as you descend": "Eiffel Tower at Sunset",
  "Head for the Denon wing first thing for the Mona Lisa before the tour groups arrive": "The Louvre Museum",
  "Allow extra time — CDG security and immigration queues can be long in peak summer": "Depart via CDG Airport",
  "A loop around the terminal or nearby park to loosen up before ~21 hours in transit": "Pre-flight Walk",
  "Since 1932; lamb, dolmades and barrel wine under the plane trees": "Platanos Taverna Dinner",
  "Recovery day after the long flight — a Greek coffee in Syntagma Square is enough of an agenda": "Slow Morning in Athens"
};

let filledCount = 0;
data.itinerary.forEach(leg => {
  if (leg.suggestedActivities) {
    leg.suggestedActivities.forEach(a => {
      if (!a.title || !a.title.trim()) {
        const title = titleMap[a.notes];
        if (title) {
          a.title = title;
          filledCount++;
        } else {
          // generic fallback
          if (a.notes.includes('train') || a.notes.includes('Train')) {
             a.title = 'Train Transfer';
          } else if (a.notes.includes('flight') || a.notes.includes('airport')) {
             a.title = 'Airport Transfer';
          } else {
             a.title = 'Suggested Experience';
          }
          filledCount++;
        }
      }
    });
  }
});

fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
console.log('Filled', filledCount, 'empty activities.');
