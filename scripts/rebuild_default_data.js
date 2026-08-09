/**
 * Rebuild DEFAULT_DATA in js/utils.js with:
 *  - Clean city names in all from/to fields (no emoji, no "(Trip Start)" etc)
 *  - Transport items on the DEPARTURE day of each city leg (consistent convention)
 *  - Accommodation on EVERY night actually slept at that city (not departure night)
 *  - Correct dates throughout
 *  - Detailed transport fields (fromLocation, toLocation, provider, routeCode)
 *  - Detailed accom fields (location, checkInTime, checkOutTime)
 *  - Explicit startTime and endTime for activities that have times
 *
 * Trip: Sydney → Tokyo → London → Paris → Dubai → Sydney
 */

const fs = require('fs');

const hotel = (name, cost, provider, cityId, bookingRef, location, checkInTime, checkOutTime) => ({
  text: name,
  cost: String(cost),
  status: 'confirmed',
  provider,
  cityId,
  location,
  checkInTime,
  checkOutTime,
  ...(bookingRef ? { bookingRef } : {})
});

const transport = (text, cost, status, bookingRef, fromLocation, toLocation, provider, routeCode) => ({
  text,
  cost: String(cost),
  status,
  fromLocation,
  toLocation,
  provider,
  routeCode,
  ...(bookingRef ? { bookingRef } : {})
});

const tokyoHotel  = hotel('Shinjuku Prince Hotel',       150, 'Booking.com', 'city-tokyo',  'BK-TYO-2847', '1-30-1 Kabukicho, Shinjuku City', '15:00', '11:00');
const londonHotel = hotel('The Hoxton, Shoreditch',      250, 'Hoxton Direct', 'city-london', 'HOX-97321', '81 Great Eastern St, London', '14:00', '12:00');
const parisHotel  = hotel('Hotel Le Walt',               280, 'Hotels.com',  'city-paris',  'HLW-PAR-5512', '37 Avenue de la Motte-Picquet, Paris', '15:00', '12:00');
const dubaiHotel  = hotel('Dubai Airport Transit Hotel', 150, 'Booking.com', 'city-dubai',  'BK-DXB-0142', 'Terminal 3, Dubai International Airport', '14:00', '12:00');

// Helper to convert "18:00 - 19:30" to { startTime, endTime }
function parseTime(timeStr) {
  if (!timeStr) return { startTime: '', endTime: '' };
  const parts = timeStr.split('-').map(s => s.trim());
  return {
    startTime: parts[0] || '',
    endTime: parts[1] || ''
  };
}

const act = (text, time, cost, id, cityId) => ({
  text,
  time,
  cost: String(cost),
  done: false,
  ...parseTime(time),
  ...(id ? { activityId: id } : {}),
  ...(cityId ? { cityId } : {})
});

const itinerary = [
  // ─────────────────────────────────────────────────────
  // LEG 0: Sydney (departure only)
  // ─────────────────────────────────────────────────────
  {
    id: 'city-sydney-start',
    label: 'Sydney (Trip Start)',
    colour: '#34495e',
    cityFood: [],
    suggestedActivities: [],
    legTips: [
      { text: 'Pack your passport and all travel documents in your carry-on.', cityId: 'city-sydney' },
      { text: 'Check in online 24 hours before your flight.', cityId: 'city-sydney' },
      { text: 'Arrive at the airport at least 3 hours before international departure.', cityId: 'city-sydney' }
    ],
    days: [
      {
        date: '2026-06-01', day: 'Mon',
        from: 'Sydney', to: 'Tokyo',
        completed: false,
        desc: 'Depart Sydney for Tokyo',
        transportItems: [
          transport('Qantas Flight QF61 | Dep 10:15 | Arr +1 19:00 | Sydney → Tokyo', 850, 'confirmed', 'QF88X2', 'Sydney Kingsford Smith (SYD) - Terminal 1', 'Tokyo Narita (NRT) - Terminal 2', 'Qantas Airways', 'QF61')
        ],
        accomItems: [],
        activityItems: [
          act('Arrive at Sydney Kingsford Smith Airport', '07:00 - 08:00', 0)
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 1: Tokyo
  // ─────────────────────────────────────────────────────
  {
    id: 'city-tokyo',
    label: '🌸 Tokyo',
    colour: '#e74c3c',
    cityFood: [
      { text: 'Ramen at Ichiran (solo booth, authentic hakata style)', done: false, cityId: 'city-tokyo' },
      { text: 'Sushi breakfast at Tsukiji Outer Market', done: false, cityId: 'city-tokyo' },
      { text: 'Wagyu beef at Matsusaka Don', done: false, cityId: 'city-tokyo' },
      { text: 'Yakitori under the train tracks in Yurakucho', done: false, cityId: 'city-tokyo' }
    ],
    legTips: [
      { text: 'Get a Suica or Pasmo card for seamless train travel.', cityId: 'city-tokyo' },
      { text: 'Convenience stores (7-Eleven, FamilyMart) sell incredible hot food 24/7.', cityId: 'city-tokyo' },
      { text: 'Most restaurants have plastic food displays outside — point to order if needed.', cityId: 'city-tokyo' }
    ],
    suggestedActivities: [
      { title: 'Senso-ji Temple & Nakamise Street', category: 'sight', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-1', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Shibuya Crossing & Hachiko Statue', category: 'sight', estTime: '1 hr', estCost: '0', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-2', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'teamLab Borderless Digital Art Museum', category: 'experience', estTime: '3 hrs', estCost: '32', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-3', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Harajuku & Takeshita Street', category: 'sight', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-4', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Day trip to Nikko Shrines', category: 'day-trip', estTime: '8 hrs', estCost: '60', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-5', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Robot Restaurant Show', category: 'entertainment', estTime: '90 mins', estCost: '80', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-6', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Meiji Jingu Shrine', category: 'sight', estTime: '1.5 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-7', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Tsukiji Outer Market Breakfast', category: 'food', estTime: '2 hrs', estCost: '20', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-8', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Akihabara Electronics District', category: 'shopping', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-tokyo', id: 'act-sug-tokyo-9', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' }
    ],
    days: [
      {
        date: '2026-06-02', day: 'Tue',
        from: 'Sydney', to: 'Tokyo',
        completed: false,
        desc: 'Arrive in Tokyo',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          act('Check in, freshen up, explore Shinjuku at night', '20:00 - 22:00', 0)
        ]
      },
      {
        date: '2026-06-03', day: 'Wed',
        from: 'Tokyo', to: 'Tokyo',
        completed: false,
        desc: 'Senso-ji & Akihabara',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          act('Senso-ji Temple in Asakusa', '09:00 - 11:30', 0),
          act('Akihabara Electronics & Anime District', '14:00 - 17:00', 0)
        ]
      },
      {
        date: '2026-06-04', day: 'Thu',
        from: 'Tokyo', to: 'Tokyo',
        completed: false,
        desc: 'Shibuya & Harajuku',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          act('Shibuya Crossing & Hachiko Statue', '10:00 - 12:00', 0),
          act('Harajuku Takeshita Street & Meiji Shrine', '13:30 - 16:30', 0)
        ]
      },
      {
        date: '2026-06-05', day: 'Fri',
        from: 'Tokyo', to: 'Tokyo',
        completed: false,
        desc: 'Day trip to Nikko',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          act('Nikko Tosho-gu Shrine Complex (UNESCO)', '09:00 - 17:00', 60),
          act('Kegon Waterfall', '11:00 - 12:00', 8)
        ]
      },
      {
        date: '2026-06-06', day: 'Sat',
        from: 'Tokyo', to: 'Tokyo',
        completed: false,
        desc: 'Tsukiji & Ginza',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          act('Tsukiji Outer Market breakfast', '07:30 - 09:30', 20),
          act('teamLab Borderless Digital Art Museum', '13:00 - 16:00', 32)
        ]
      },
      {
        date: '2026-06-07', day: 'Sun',
        from: 'Tokyo', to: 'London',
        completed: false,
        desc: 'Depart Tokyo for London',
        transportItems: [
          transport('British Airways Flight BA8 | Dep 09:35 | Arr 16:10 | Tokyo → London', 1100, 'confirmed', 'BA-TYO-991', 'Tokyo Haneda (HND) - Terminal 3', 'London Heathrow (LHR) - Terminal 5', 'British Airways', 'BA8')
        ],
        accomItems: [],
        activityItems: [
          act('Transfer to Haneda Airport', '07:00 - 08:30', 30)
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 2: London
  // ─────────────────────────────────────────────────────
  {
    id: 'city-london',
    label: '🏰 London',
    colour: '#2980b9',
    cityFood: [
      { text: 'Fish & Chips at Poppies Fish & Chips (Spitalfields)', done: false, cityId: 'city-london' },
      { text: 'Full English Breakfast at a classic caff', done: false, cityId: 'city-london' },
      { text: 'Afternoon Tea at The Ritz or Fortnum & Mason', done: false, cityId: 'city-london' }
    ],
    legTips: [
      { text: 'Get an Oyster card or use contactless for Tube and buses.', cityId: 'city-london' },
      { text: 'Most museums (British Museum, National Gallery, V&A) are free.', cityId: 'city-london' },
      { text: 'Book the London Eye and popular attractions in advance online.', cityId: 'city-london' }
    ],
    suggestedActivities: [
      { title: 'Tower of London & Crown Jewels', category: 'sight', estTime: '3 hrs', estCost: '30', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-1', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'British Museum (Rosetta Stone)', category: 'sight', estTime: '3 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-2', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Buckingham Palace & Changing of the Guard', category: 'sight', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-3', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Walk South Bank: Borough Market to Tate Modern', category: 'sight', estTime: '3 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-4', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Day Trip to Windsor Castle', category: 'day-trip', estTime: '6 hrs', estCost: '28', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-5', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Camden Market', category: 'shopping', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-6', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Westminster Abbey & Big Ben', category: 'sight', estTime: '2.5 hrs', estCost: '27', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-7', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Natural History Museum', category: 'sight', estTime: '2.5 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-8', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Notting Hill & Portobello Road', category: 'sight', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-london', id: 'act-sug-lon-9', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' }
    ],
    days: [
      {
        date: '2026-06-07', day: 'Sun',
        from: 'Tokyo', to: 'London',
        completed: false,
        desc: 'Arrive in London',
        transportItems: [],
        accomItems: [londonHotel],
        activityItems: [
          act('Check in to The Hoxton, Shoreditch', '17:00 - 18:00', 0),
          act('Evening stroll along the Thames', '19:30 - 21:00', 0)
        ]
      },
      {
        date: '2026-06-08', day: 'Mon',
        from: 'London', to: 'London',
        completed: false,
        desc: 'Tower of London & South Bank',
        transportItems: [],
        accomItems: [londonHotel],
        activityItems: [
          act('Tower of London & Crown Jewels', '09:30 - 12:30', 30),
          act('Borough Market & South Bank walk to Tate Modern', '13:30 - 16:30', 15)
        ]
      },
      {
        date: '2026-06-09', day: 'Tue',
        from: 'London', to: 'London',
        completed: false,
        desc: 'Buckingham Palace & Westminster',
        transportItems: [],
        accomItems: [londonHotel],
        activityItems: [
          act('Buckingham Palace (Changing of the Guard)', '10:00 - 11:30', 0),
          act('Westminster Abbey & Big Ben', '13:00 - 15:30', 27)
        ]
      },
      {
        date: '2026-06-10', day: 'Wed',
        from: 'London', to: 'London',
        completed: false,
        desc: 'British Museum & Camden',
        transportItems: [],
        accomItems: [londonHotel],
        activityItems: [
          act('British Museum (free)', '09:30 - 13:00', 0),
          act('Camden Market — vintage & street food', '14:30 - 17:30', 20)
        ]
      },
      {
        date: '2026-06-11', day: 'Thu',
        from: 'London', to: 'Paris',
        completed: false,
        desc: 'Depart London to Paris by Eurostar',
        transportItems: [
          transport('Eurostar Train | Dep 10:30 | Arr 13:47 | London → Paris', 120, 'confirmed', 'ES-44812', 'London St Pancras International', 'Paris Gare du Nord', 'Eurostar', 'ES9014')
        ],
        accomItems: [],
        activityItems: [
          act('St Pancras International — enjoy the Grand Terrace before boarding', '09:00 - 10:00', 0)
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 3: Paris
  // ─────────────────────────────────────────────────────
  {
    id: 'city-paris',
    label: '🥐 Paris',
    colour: '#8e44ad',
    cityFood: [
      { text: 'Fresh croissant from a local boulangerie', done: false, cityId: 'city-paris' },
      { text: 'Macarons from Pierre Hermé', done: false, cityId: 'city-paris' },
      { text: 'Steak Frites at Le Relais de l\'Entrecôte', done: false, cityId: 'city-paris' }
    ],
    legTips: [
      { text: 'Learn a few basic French phrases — even just Bonjour and Merci.', cityId: 'city-paris' },
      { text: 'Beware of pickpockets around major tourist sites like the Eiffel Tower.', cityId: 'city-paris' },
      { text: 'The Paris Museum Pass covers 50+ museums — great value if you plan ahead.', cityId: 'city-paris' }
    ],
    suggestedActivities: [
      { title: 'Eiffel Tower at Sunset', category: 'sight', estTime: '2 hrs', estCost: '26', assignedDayIdx: null, cityId: 'city-paris', id: 'act-sug-par-1', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Louvre Museum (Mona Lisa & Venus de Milo)', category: 'sight', estTime: '4 hrs', estCost: '22', assignedDayIdx: null, cityId: 'city-paris', id: 'act-sug-par-2', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Montmartre & Sacré-Cœur Basilica', category: 'sight', estTime: '3 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-paris', id: 'act-sug-par-3', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Versailles Palace & Gardens', category: 'day-trip', estTime: '6 hrs', estCost: '25', assignedDayIdx: null, cityId: 'city-paris', id: 'act-sug-par-4', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Seine River Cruise', category: 'tour', estTime: '1.5 hrs', estCost: '20', assignedDayIdx: null, cityId: 'city-paris', id: 'act-sug-par-5', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Notre-Dame Cathedral & Île de la Cité', category: 'sight', estTime: '2 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-paris', id: 'act-sug-par-6', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Musée d\'Orsay (Impressionists)', category: 'sight', estTime: '3 hrs', estCost: '16', assignedDayIdx: null, cityId: 'city-paris', id: 'act-sug-par-7', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Champs-Élysées & Arc de Triomphe', category: 'sight', estTime: '2 hrs', estCost: '13', assignedDayIdx: null, cityId: 'city-paris', id: 'act-sug-par-8', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' }
    ],
    days: [
      {
        date: '2026-06-11', day: 'Thu',
        from: 'London', to: 'Paris',
        completed: false,
        desc: 'Arrive in Paris',
        transportItems: [],
        accomItems: [parisHotel],
        activityItems: [
          act('Check in to Hotel Le Walt', '15:00 - 16:00', 0),
          act('Eiffel Tower at golden hour', '19:30 - 21:00', 26)
        ]
      },
      {
        date: '2026-06-12', day: 'Fri',
        from: 'Paris', to: 'Paris',
        completed: false,
        desc: 'Louvre & Montmartre',
        transportItems: [],
        accomItems: [parisHotel],
        activityItems: [
          act('Louvre Museum (Mona Lisa)', '09:00 - 13:00', 22),
          act('Montmartre & Sacré-Cœur Basilica', '15:00 - 18:00', 0)
        ]
      },
      {
        date: '2026-06-13', day: 'Sat',
        from: 'Paris', to: 'Paris',
        completed: false,
        desc: 'Notre-Dame & Champs-Élysées',
        transportItems: [],
        accomItems: [parisHotel],
        activityItems: [
          act('Notre-Dame Cathedral & Latin Quarter walk', '10:00 - 13:00', 0),
          act('Champs-Élysées & Arc de Triomphe', '15:00 - 17:30', 13)
        ]
      },
      {
        date: '2026-06-14', day: 'Sun',
        from: 'Paris', to: 'Dubai',
        completed: false,
        desc: 'Last day in Paris, evening flight to Dubai',
        transportItems: [
          transport('Emirates Flight EK76 | Dep 21:55 | Arr +1 06:35 | Paris → Dubai', 750, 'confirmed', 'EK-CDG-7712', 'Paris Charles de Gaulle (CDG) - Terminal 2C', 'Dubai International (DXB) - Terminal 3', 'Emirates', 'EK76')
        ],
        accomItems: [],
        activityItems: [
          act('Seine River Cruise (last morning in Paris)', '10:00 - 11:30', 20),
          act('Transfer to Charles de Gaulle Airport', '18:00 - 19:30', 25)
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 4: Dubai Transit
  // ─────────────────────────────────────────────────────
  {
    id: 'city-dubai',
    label: '🐪 Dubai (Transit)',
    colour: '#f39c12',
    cityFood: [
      { text: 'Shawarma in old Deira souks', done: false, cityId: 'city-dubai' },
      { text: 'Karak Chai (spiced tea) — a UAE classic', done: false, cityId: 'city-dubai' }
    ],
    legTips: [
      { text: 'Dress modestly in public areas and shopping malls.', cityId: 'city-dubai' },
      { text: 'The Dubai Metro Gold Line connects the airport to the city centre.', cityId: 'city-dubai' }
    ],
    suggestedActivities: [
      { title: 'Burj Khalifa Observation Deck (Level 124)', category: 'sight', estTime: '2 hrs', estCost: '50', assignedDayIdx: null, cityId: 'city-dubai', id: 'act-sug-dxb-1', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' },
      { title: 'Dubai Mall & Fountain Show (evening)', category: 'sight', estTime: '3 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-dubai', id: 'act-sug-dxb-2', assignedDate: '', startDate: '', endDate: '', startTime: '', endTime: '' }
    ],
    days: [
      {
        date: '2026-06-15', day: 'Mon',
        from: 'Paris', to: 'Dubai',
        completed: false,
        desc: 'Arrive in Dubai — Transit',
        transportItems: [],
        accomItems: [dubaiHotel],
        activityItems: [
          act('Check in to Dubai Airport Transit Hotel', '08:00 - 09:00', 0),
          act('Burj Khalifa & Dubai Mall Fountain Show', '17:00 - 20:00', 50)
        ]
      },
      {
        date: '2026-06-16', day: 'Tue',
        from: 'Dubai', to: 'Dubai',
        completed: false,
        desc: 'Dubai — one full day to explore',
        transportItems: [],
        accomItems: [dubaiHotel],
        activityItems: [
          act('Dubai Creek & Al Fahidi Historic District', '09:00 - 12:00', 0),
          act('Dubai Museum & Gold Souk', '13:00 - 16:00', 5)
        ]
      },
      {
        date: '2026-06-17', day: 'Wed',
        from: 'Dubai', to: 'Sydney',
        completed: false,
        desc: 'Depart Dubai for Sydney',
        transportItems: [
          transport('Emirates Flight EK412 | Dep 10:15 | Arr +1 06:00 | Dubai → Sydney', 750, 'confirmed', 'EK-DXB-9981', 'Dubai International (DXB) - Terminal 3', 'Sydney Kingsford Smith (SYD) - Terminal 1', 'Emirates', 'EK412')
        ],
        accomItems: [],
        activityItems: [
          act('Early transfer to Dubai International Airport', '07:00 - 08:30', 25)
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 5: Sydney
  // ─────────────────────────────────────────────────────
  {
    id: 'city-sydney-end',
    label: '🛬 Sydney (Return)',
    colour: '#27ae60',
    cityFood: [],
    suggestedActivities: [],
    legTips: [
      { text: 'Declare all food items at Australian customs — heavy fines apply.', cityId: 'city-sydney' },
      { text: 'The Airport Link train gets you from the airport to the CBD in 13 minutes.', cityId: 'city-sydney' }
    ],
    days: [
      {
        date: '2026-06-18', day: 'Thu',
        from: 'Dubai', to: 'Sydney',
        completed: false,
        desc: 'Arrive home in Sydney!',
        transportItems: [],
        accomItems: [],
        activityItems: [
          act('Welcome home! Clear customs and head home.', '06:00 - 09:00', 0)
        ]
      }
    ]
  }
];

const content = fs.readFileSync('js/utils.js', 'utf8');
const newContent = content.replace(
  /const DEFAULT_DATA = \[[\s\S]*?\];/,
  'const DEFAULT_DATA = ' + JSON.stringify(itinerary, null, 2) + ';'
);

fs.writeFileSync('js/utils.js', newContent);
console.log('js/utils.js updated successfully with detailed properties.');
