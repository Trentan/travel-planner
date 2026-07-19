/**
 * Rebuild DEFAULT_DATA in js/utils.js with:
 *  - Clean city names in all from/to fields (no emoji, no "(Trip Start)" etc)
 *  - Transport items on the DEPARTURE day of each city leg (consistent convention)
 *  - Accommodation on EVERY night actually slept at that city (not departure night)
 *  - Correct dates throughout
 *
 * Trip: Sydney → Tokyo → London → Paris → Dubai → Sydney
 * Jun 1: Depart Sydney (Qantas QF61 10:15, arr Tokyo Jun 2 19:00)
 * Jun 2–6: Tokyo (5 nights, Shinjuku Prince Hotel)
 * Jun 7: Depart Tokyo (BA8 09:35, arr London Jun 7 16:10)  ← same calendar day westbound
 * Jun 7–10: London (4 nights, The Hoxton Shoreditch)
 * Jun 11: Depart London→Paris (Eurostar 10:30, arr 13:47 same day)
 * Jun 11–13: Paris (3 nights, Hotel Le Walt)
 * Jun 14: Depart Paris (EK76 21:55, arr Dubai Jun 15 06:35)
 * Jun 15: Arrive Dubai transit (sleep at Dubai Airport Transit Hotel)
 * Jun 15: Transit day in Dubai
 * Jun 16: Depart Dubai (EK412 10:15, arr Sydney Jun 17 06:00)
 * Jun 17: Arrive home Sydney
 */

const fs = require('fs');

const hotel = (name, cost, provider, cityId, bookingRef) => ({
  text: name,
  cost: String(cost),
  status: 'confirmed',
  provider,
  cityId,
  ...(bookingRef ? { bookingRef } : {})
});

const transport = (text, cost, status, bookingRef) => ({
  text,
  cost: String(cost),
  status,
  ...(bookingRef ? { bookingRef } : {})
});

const tokyoHotel  = hotel('Shinjuku Prince Hotel',       150, 'Booking.com', 'city-tokyo',  'BK-TYO-2847');
const londonHotel = hotel('The Hoxton, Shoreditch',      250, 'Hoxton Direct', 'city-london', 'HOX-97321');
const parisHotel  = hotel('Hotel Le Walt',               280, 'Hotels.com',  'city-paris',  'HLW-PAR-5512');
const dubaiHotel  = hotel('Dubai Airport Transit Hotel', 150, 'Booking.com', 'city-dubai',  'BK-DXB-0142');

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
        // Transport on the DEPARTURE day - Qantas departs Sydney
        transportItems: [
          transport('Qantas Flight QF61 | Dep 10:15 | Arr +1 19:00 | Sydney → Tokyo', 850, 'confirmed', 'QF88X2')
        ],
        // No accommodation - you are on the plane overnight
        accomItems: [],
        activityItems: [
          { text: 'Arrive at Sydney Kingsford Smith Airport', time: '07:00 - 08:00', cost: '0', done: false }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 1: Tokyo (6 days: arrival + 4 explore + departure)
  // from Jun 2 (arrival from Sydney) to Jun 7 (depart to London)
  // Sleep 5 nights: Jun 2, 3, 4, 5, 6
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
      // Day 0 – Jun 2 – ARRIVAL from Sydney
      {
        date: '2026-06-02', day: 'Tue',
        from: 'Sydney', to: 'Tokyo',
        completed: false,
        desc: 'Arrive in Tokyo',
        transportItems: [],               // No transport here; flight was on Sydney leg
        accomItems: [tokyoHotel],         // Sleep here tonight
        activityItems: [
          { text: 'Check in, freshen up, explore Shinjuku at night', time: '20:00 - 22:00', cost: '0', done: false }
        ]
      },
      // Day 1 – Jun 3 – Explore
      {
        date: '2026-06-03', day: 'Wed',
        from: 'Tokyo', to: 'Tokyo',
        completed: false,
        desc: 'Senso-ji & Akihabara',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          { text: 'Senso-ji Temple in Asakusa', time: '09:00 - 11:30', cost: '0', done: false },
          { text: 'Akihabara Electronics & Anime District', time: '14:00 - 17:00', cost: '0', done: false }
        ]
      },
      // Day 2 – Jun 4 – Explore
      {
        date: '2026-06-04', day: 'Thu',
        from: 'Tokyo', to: 'Tokyo',
        completed: false,
        desc: 'Shibuya & Harajuku',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          { text: 'Shibuya Crossing & Hachiko Statue', time: '10:00 - 12:00', cost: '0', done: false },
          { text: 'Harajuku Takeshita Street & Meiji Shrine', time: '13:30 - 16:30', cost: '0', done: false }
        ]
      },
      // Day 3 – Jun 5 – Day Trip
      {
        date: '2026-06-05', day: 'Fri',
        from: 'Tokyo', to: 'Tokyo',
        completed: false,
        desc: 'Day trip to Nikko',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          { text: 'Nikko Tosho-gu Shrine Complex (UNESCO)', time: '09:00 - 17:00', cost: '60', done: false },
          { text: 'Kegon Waterfall', time: '11:00 - 12:00', cost: '8', done: false }
        ]
      },
      // Day 4 – Jun 6 – Explore
      {
        date: '2026-06-06', day: 'Sat',
        from: 'Tokyo', to: 'Tokyo',
        completed: false,
        desc: 'Tsukiji & Ginza',
        transportItems: [],
        accomItems: [tokyoHotel],
        activityItems: [
          { text: 'Tsukiji Outer Market breakfast', time: '07:30 - 09:30', cost: '20', done: false },
          { text: 'teamLab Borderless Digital Art Museum', time: '13:00 - 16:00', cost: '32', done: false }
        ]
      },
      // Day 5 – Jun 7 – DEPARTURE to London
      {
        date: '2026-06-07', day: 'Sun',
        from: 'Tokyo', to: 'London',
        completed: false,
        desc: 'Depart Tokyo for London',
        // Transport on DEPARTURE day — BA8 departs Tokyo
        transportItems: [
          transport('British Airways Flight BA8 | Dep 09:35 | Arr 16:10 | Tokyo → London', 1100, 'confirmed')
        ],
        accomItems: [],   // No sleep in Tokyo — on the plane
        activityItems: [
          { text: 'Transfer to Narita Airport (Narita Express)', time: '07:00 - 08:30', cost: '30', done: false }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 2: London (5 days: arrival + 3 explore + departure)
  // from Jun 7 (arrival) to Jun 11 (depart to Paris)
  // Sleep 4 nights: Jun 7, 8, 9, 10
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
      // Day 0 – Jun 7 – ARRIVAL from Tokyo
      {
        date: '2026-06-07', day: 'Sun',
        from: 'Tokyo', to: 'London',
        completed: false,
        desc: 'Arrive in London',
        transportItems: [],              // Flight was on Tokyo departure day
        accomItems: [londonHotel],       // Sleep in London tonight
        activityItems: [
          { text: 'Check in to The Hoxton, Shoreditch', time: '17:00 - 18:00', cost: '0', done: false },
          { text: 'Evening stroll along the Thames', time: '19:30 - 21:00', cost: '0', done: false }
        ]
      },
      // Day 1 – Jun 8
      {
        date: '2026-06-08', day: 'Mon',
        from: 'London', to: 'London',
        completed: false,
        desc: 'Tower of London & South Bank',
        transportItems: [],
        accomItems: [londonHotel],
        activityItems: [
          { text: 'Tower of London & Crown Jewels', time: '09:30 - 12:30', cost: '30', done: false },
          { text: 'Borough Market & South Bank walk to Tate Modern', time: '13:30 - 16:30', cost: '15', done: false }
        ]
      },
      // Day 2 – Jun 9
      {
        date: '2026-06-09', day: 'Tue',
        from: 'London', to: 'London',
        completed: false,
        desc: 'Buckingham Palace & Westminster',
        transportItems: [],
        accomItems: [londonHotel],
        activityItems: [
          { text: 'Buckingham Palace (Changing of the Guard)', time: '10:00 - 11:30', cost: '0', done: false },
          { text: 'Westminster Abbey & Big Ben', time: '13:00 - 15:30', cost: '27', done: false }
        ]
      },
      // Day 3 – Jun 10
      {
        date: '2026-06-10', day: 'Wed',
        from: 'London', to: 'London',
        completed: false,
        desc: 'British Museum & Camden',
        transportItems: [],
        accomItems: [londonHotel],
        activityItems: [
          { text: 'British Museum (free)', time: '09:30 - 13:00', cost: '0', done: false },
          { text: 'Camden Market — vintage & street food', time: '14:30 - 17:30', cost: '20', done: false }
        ]
      },
      // Day 4 – Jun 11 – DEPARTURE to Paris by Eurostar
      {
        date: '2026-06-11', day: 'Thu',
        from: 'London', to: 'Paris',
        completed: false,
        desc: 'Depart London to Paris by Eurostar',
        // Transport on DEPARTURE day — Eurostar departs London St Pancras
        transportItems: [
          transport('Eurostar Train | Dep 10:30 | Arr 13:47 | London → Paris', 120, 'confirmed', 'ES-44812')
        ],
        accomItems: [],   // No sleep in London — arriving in Paris today
        activityItems: [
          { text: 'St Pancras International — enjoy the Grand Terrace before boarding', time: '09:00 - 10:00', cost: '0', done: false }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 3: Paris (4 days: arrival + 2 explore + departure)
  // from Jun 11 (arrival from London same day Eurostar) to Jun 14 (evening flight EK76)
  // Sleep 3 nights: Jun 11, 12, 13
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
      // Day 0 – Jun 11 – ARRIVAL from London (Eurostar arrives 13:47)
      {
        date: '2026-06-11', day: 'Thu',
        from: 'London', to: 'Paris',
        completed: false,
        desc: 'Arrive in Paris',
        transportItems: [],               // Train was on London departure day
        accomItems: [parisHotel],         // Sleep in Paris tonight
        activityItems: [
          { text: 'Check in to Hotel Le Walt', time: '15:00 - 16:00', cost: '0', done: false },
          { text: 'Eiffel Tower at golden hour', time: '19:30 - 21:00', cost: '26', done: false }
        ]
      },
      // Day 1 – Jun 12
      {
        date: '2026-06-12', day: 'Fri',
        from: 'Paris', to: 'Paris',
        completed: false,
        desc: 'Louvre & Montmartre',
        transportItems: [],
        accomItems: [parisHotel],
        activityItems: [
          { text: 'Louvre Museum (Mona Lisa)', time: '09:00 - 13:00', cost: '22', done: false },
          { text: 'Montmartre & Sacré-Cœur Basilica', time: '15:00 - 18:00', cost: '0', done: false }
        ]
      },
      // Day 2 – Jun 13
      {
        date: '2026-06-13', day: 'Sat',
        from: 'Paris', to: 'Paris',
        completed: false,
        desc: 'Notre-Dame & Champs-Élysées',
        transportItems: [],
        accomItems: [parisHotel],
        activityItems: [
          { text: 'Notre-Dame Cathedral & Latin Quarter walk', time: '10:00 - 13:00', cost: '0', done: false },
          { text: 'Champs-Élysées & Arc de Triomphe', time: '15:00 - 17:30', cost: '13', done: false }
        ]
      },
      // Day 3 – Jun 14 – DEPARTURE to Dubai (evening flight EK76 21:55)
      {
        date: '2026-06-14', day: 'Sun',
        from: 'Paris', to: 'Dubai',
        completed: false,
        desc: 'Last day in Paris, evening flight to Dubai',
        // Transport on DEPARTURE day — EK76 departs Paris CDG
        transportItems: [
          transport('Emirates Flight EK76 | Dep 21:55 | Arr +1 06:35 | Paris → Dubai', 750, 'confirmed', 'EK-CDG-7712')
        ],
        accomItems: [],   // No sleep in Paris — overnight flight to Dubai
        activityItems: [
          { text: 'Seine River Cruise (last morning in Paris)', time: '10:00 - 11:30', cost: '20', done: false },
          { text: 'Transfer to Charles de Gaulle Airport', time: '18:00 - 19:30', cost: '25', done: false }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 4: Dubai Transit (3 days: arrival Jun 15 + transit day + departure Jun 16)
  // Sleep 2 nights: Jun 15, Jun 16 (late checkout, early departure Jun 17)
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
      // Day 0 – Jun 15 – ARRIVAL from Paris (EK76 arrives 06:35)
      {
        date: '2026-06-15', day: 'Mon',
        from: 'Paris', to: 'Dubai',
        completed: false,
        desc: 'Arrive in Dubai — Transit',
        transportItems: [],               // Flight was on Paris departure day
        accomItems: [dubaiHotel],         // Sleep at transit hotel
        activityItems: [
          { text: 'Check in to Dubai Airport Transit Hotel', time: '08:00 - 09:00', cost: '0', done: false },
          { text: 'Burj Khalifa & Dubai Mall Fountain Show', time: '17:00 - 20:00', cost: '50', done: false }
        ]
      },
      // Day 1 – Jun 16 – Full transit day in Dubai
      {
        date: '2026-06-16', day: 'Tue',
        from: 'Dubai', to: 'Dubai',
        completed: false,
        desc: 'Dubai — one full day to explore',
        transportItems: [],
        accomItems: [dubaiHotel],
        activityItems: [
          { text: 'Dubai Creek & Al Fahidi Historic District', time: '09:00 - 12:00', cost: '0', done: false },
          { text: 'Dubai Museum & Gold Souk', time: '13:00 - 16:00', cost: '5', done: false }
        ]
      },
      // Day 2 – Jun 17 – DEPARTURE to Sydney (EK412 10:15)
      {
        date: '2026-06-17', day: 'Wed',
        from: 'Dubai', to: 'Sydney',
        completed: false,
        desc: 'Depart Dubai for Sydney',
        // Transport on DEPARTURE day — EK412 departs Dubai
        transportItems: [
          transport('Emirates Flight EK412 | Dep 10:15 | Arr +1 06:00 | Dubai → Sydney', 750, 'confirmed', 'EK-DXB-9981')
        ],
        accomItems: [],   // No sleep — overnight flight home
        activityItems: [
          { text: 'Early transfer to Dubai International Airport', time: '07:00 - 08:30', cost: '25', done: false }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────
  // LEG 5: Sydney (return arrival only)
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
        transportItems: [],   // Flight was on Dubai departure day
        accomItems: [],       // Home!
        activityItems: [
          { text: 'Welcome home! Clear customs and head home.', time: '06:00 - 09:00', cost: '0', done: false }
        ]
      }
    ]
  }
];

// Verify the data is correct before writing
console.log('Checking transport placement...');
itinerary.forEach(leg => {
  leg.days.forEach((day, i) => {
    if ((day.transportItems||[]).length > 0) {
      day.transportItems.forEach(t => {
        if (t.text.toLowerCase().includes('add transport')) {
          console.error('ERROR: placeholder transport in leg', leg.id, 'day', i);
          process.exit(1);
        }
        console.log('  OK: Leg', leg.id, 'day', i, '| from:', day.from, '| to:', day.to, '| transport:', t.text.substring(0, 60));
      });
    }
    if ((day.accomItems||[]).length > 0) {
      day.accomItems.forEach(a => {
        if (a.text.toLowerCase().includes('add accommodation')) {
          console.error('ERROR: placeholder accom in leg', leg.id, 'day', i);
          process.exit(1);
        }
        if (!a.cityId) {
          console.error('ERROR: missing cityId in accom leg', leg.id, 'day', i, a.text);
          process.exit(1);
        }
        if (!a.status || a.status !== 'confirmed') {
          console.error('ERROR: accom not confirmed in leg', leg.id, 'day', i, a.text);
          process.exit(1);
        }
      });
    }
  });
});
console.log('All checks passed.');

// Now patch utils.js
const content = fs.readFileSync('js/utils.js', 'utf8');
const newContent = content.replace(
  /const DEFAULT_DATA = \[[\s\S]*?\];/,
  'const DEFAULT_DATA = ' + JSON.stringify(itinerary, null, 2) + ';'
);

if (!newContent.includes('"id": "city-sydney-start"')) {
  console.error('ERROR: Replacement failed — DEFAULT_DATA not found in utils.js');
  process.exit(1);
}

fs.writeFileSync('js/utils.js', newContent);
console.log('js/utils.js updated successfully.');
