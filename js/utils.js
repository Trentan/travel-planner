const DEFAULT_DATA = [
  {
    id: 'leg-1', label: '🏠 Start (Brisbane)', colour: '#2C3E50',
    cityFood: [],
    suggestedActivities: [],
    legTips: [],
    days: [
      {
        date:'1 Jan', day:'Mon', from:'Home', to:'Brisbane Airport',
        completed: false, desc:'Departure day',
        transportItems: [{ text: "Flight to London", cost: "1200", status: "confirmed", bookingRef: "ABC123" }],
        accomItems: [],
        activityItems: []
      }
    ]
  },
  {
    id: 'leg-2', label: '📍 London', colour: '#E74C3C',
    cityFood: [
      { text: "Try authentic fish & chips", done: false, cityId: 'city-london' },
      { text: "Visit Borough Market", done: false, cityId: 'city-london' }
    ],
    suggestedActivities: [
      { title: 'Morning run along Thames', category: 'fitness', estTime: '1 hr', estCost: '0', assignedDayIdx: null, cityId: 'city-london' },
      { title: 'British Museum', category: 'sight', estTime: '3 hrs', estCost: '0', assignedDayIdx: null, cityId: 'city-london' },
      { title: 'West End show', category: 'attraction', estTime: '3 hrs', estCost: '80', assignedDayIdx: null, cityId: 'city-london' }
    ],
    legTips: [
      { text: "Download Citymapper for transit", cityId: 'city-london' },
      { text: "Book museum tickets in advance", cityId: 'city-london' }
    ],
    days: [
      {
        date:'2 Jan', day:'Tue', from:'Brisbane Airport', to:'London',
        completed: false, desc:'Arrival and hotel check-in',
        transportItems: [{ text: "Heathrow Express to Paddington", cost: "25", status: "pending", bookingRef: "" }],
        accomItems: [{ text: "Premier Inn London", cost: "150", status: "confirmed", bookingRef: "LON456", cityId: 'city-london' }],
        activityItems: [{ text: "Rest and explore local area", cost: "0", time: "2 hrs", done: false, cityId: 'city-london' }]
      },
      {
        date:'3 Jan', day:'Wed', from:'London', to:'London',
        completed: false, desc:'First full day exploring',
        transportItems: [{ text: "Oyster card / Contactless", cost: "10", status: "", bookingRef: "" }],
        accomItems: [{ text: "Premier Inn London", cost: "150", status: "confirmed", bookingRef: "LON456", cityId: 'city-london' }],
        activityItems: [
          { text: "British Museum", cost: "0", time: "3 hrs", done: false, cityId: 'city-london' },
          { text: "Covent Garden dinner", cost: "40", time: "2 hrs", done: false, cityId: 'city-london' }
        ]
      }
    ]
  },
  {
    id: 'leg-3', label: '✈️ London → Paris', colour: '#3498DB',
    cityFood: [],
    suggestedActivities: [],
    legTips: [],
    days: [
      {
        date:'4 Jan', day:'Thu', from:'London', to:'Paris',
        completed: false, desc:'Travel to Paris',
        transportItems: [{ text: "Eurostar to Paris", cost: "100", status: "confirmed", bookingRef: "EST789" }],
        accomItems: [],
        activityItems: []
      }
    ]
  },
  {
    id: 'leg-4', label: '📍 Paris', colour: '#3498DB',
    cityFood: [
      { text: "Croissant at local boulangerie", done: false, cityId: 'city-paris' },
      { text: "Dinner cruise on Seine", done: false, cityId: 'city-paris' }
    ],
    suggestedActivities: [
      { title: 'Run in Luxembourg Gardens', category: 'fitness', estTime: '1 hr', estCost: '0', assignedDayIdx: null, cityId: 'city-paris' },
      { title: 'Louvre Museum', category: 'sight', estTime: '4 hrs', estCost: '17', assignedDayIdx: null, cityId: 'city-paris' },
      { title: 'Eiffel Tower sunset', category: 'sight', estTime: '2 hrs', estCost: '28', assignedDayIdx: null, cityId: 'city-paris' }
    ],
    legTips: [
      { text: "Museum pass saves money", cityId: 'city-paris' },
      { text: "Book Eiffel Tower in advance", cityId: 'city-paris' }
    ],
    days: [
      {
        date:'4 Jan', day:'Thu', from:'London', to:'Paris',
        completed: false, desc:'Arrival in Paris',
        transportItems: [],
        accomItems: [{ text: "Hotel des Arts", cost: "180", status: "confirmed", bookingRef: "PA987", cityId: 'city-paris' }],
        activityItems: [{ text: "Evening Seine walk", cost: "0", time: "1.5 hrs", done: false, cityId: 'city-paris' }]
      },
      {
        date:'5 Jan', day:'Fri', from:'Paris', to:'Paris',
        completed: false, desc:'Exploring the city',
        transportItems: [{ text: "Metro day pass", cost: "8", status: "", bookingRef: "" }],
        accomItems: [{ text: "Hotel des Arts", cost: "180", status: "confirmed", bookingRef: "PA987", cityId: 'city-paris' }],
        activityItems: [
          { text: "Louvre Museum", cost: "17", time: "4 hrs", done: false, cityId: 'city-paris' },
          { text: "Eiffel Tower", cost: "28", time: "2 hrs", done: false, cityId: 'city-paris' }
        ]
      }
    ]
  },
  {
    id: 'leg-5', label: '🏠 Return (Brisbane)', colour: '#2C3E50',
    cityFood: [],
    suggestedActivities: [],
    legTips: [],
    days: [
      {
        date:'6 Jan', day:'Sat', from:'Paris', to:'Home',
        completed: false, desc:'Return flight home',
        transportItems: [{ text: "Flight CDG → BNE", cost: "1200", status: "confirmed", bookingRef: "RET321" }],
        accomItems: [],
        activityItems: []
      }
    ]
  }
];

const ACTIVITY_CATEGORIES = {
  fitness: { emoji: '🏃', label: 'Fitness' },
  sight: { emoji: '🏛️', label: 'Sights' },
  attraction: { emoji: '🎢', label: 'Attractions' },
  wellness: { emoji: '🧘', label: 'Wellness' },
  food: { emoji: '🍽️', label: 'Food' },
  tour: { emoji: '🚌', label: 'Tour' }
};

function getActivityEmoji(category) {
  return ACTIVITY_CATEGORIES[category]?.emoji || '📍';
}

function getActivityLabel(category) {
  return ACTIVITY_CATEGORIES[category]?.label || 'Activity';
}

const DEFAULT_LEAVE_HOME = [
  {text: "Lock all doors and windows", done: false},
  {text: "Set security alarm / notify security company", done: false},
  {text: "Turn off all taps and check for leaks", done: false},
  {text: "Switch off PowerPoints at the wall (except fridge)", done: false},
  {text: "Turn off gas supply if applicable", done: false},
  {text: "Adjust thermostat to away/saver mode", done: false},
  {text: "Remove or use up perishables from fridge", done: false},
  {text: "Check pantry for items that may expire", done: false},
  {text: "Take out all rubbish and recycling", done: false},
  {text: "Check mailbox is empty / hold mail service", done: false},
  {text: "Pause or reschedule any regular deliveries", done: false},
  {text: "Pause gym membership or group activities", done: false},
  {text: "Charge all devices (phones, tablets, power banks)", done: false},
  {text: "Download offline maps and confirmations", done: false},
  {text: "Notify emergency contact of travel plans", done: false},
  {text: "Water plants or arrange plant care", done: false},
  {text: "Set up lights on timers (if away long)", done: false},
  {text: "Close blinds/curtains and secure loose outdoor items", done: false}
];

const DEFAULT_PACKING = [
  {
    areaName: "🚶 Walk-on Gear (Wear onto plane)",
    areaColor: "#E67E22",
    categories: [
      { title: "Plane Outfit", items: [{text: "Underwear", done:false}, {text: "Jeans", done:false}, {text: "Belt", done:false}, {text: "Sports shoes", done:false}, {text: "Socks", done:false}, {text: "Activewear shirt", done:false}, {text: "Hoodie", done:false}, {text: "Sunglasses", done:false}] }
    ]
  },
  {
    areaName: "🧳 Carry-on Packed Bag (Main Luggage)",
    areaColor: "#2980B9",
    categories: [
      { title: "Clothes", items: [{text: "T-shirts, Tank Tops", done:false}, {text: "Shorts, Skirts", done:false}, {text: "Pants", done:false}, {text: "Layers (hoodie, sweater)", done:false}, {text: "Swim suit", done:false}, {text: "Dress", done:false}, {text: "Socks", done:false}, {text: "Underwear", done:false}, {text: "Bras", done:false}, {text: "Pyjamas, Sleepwear", done:false}, {text: "Formal Wear", done:false}, {text: "Hat", done:false}, {text: "Workout outfit", done:false}, {text: "Other accessories / Earrings", done:false}] },
      { title: "Shoes & Misc", items: [{text: "Dress shoes", done:false}, {text: "Sandals/Crocs", done:false}, {text: "Presents / Card", done:false}, {text: "Reusable tote bag", done:false}, {text: "Pillowcase for used clothes", done:false}, {text: "Laundry Sheets for washing", done:false}, {text: "Raincoat/Umbrella", done:false}] },
      { title: "Dry Toiletries", items: [{text: "Floss", done:false}, {text: "Toothbrush", done:false}, {text: "Razor (Cartidge), Shaving", done:false}, {text: "Bar of Soap", done:false}, {text: "Cotton pad, q-tips", done:false}, {text: "Nail clippers/tweezers", done:false}, {text: "Personal Hygiene items (Pads)", done:false}, {text: "Makeup", done:false}, {text: "Hair clips, hair ties", done:false}, {text: "Hair Brush/comb", done:false}, {text: "Bandaids, Electrolyte packs", done:false}, {text: "Body wipes", done:false}, {text: "Panadol / Nurofen", done:false}, {text: "Vitamins / Tablets", done:false}] },
      { title: "💧 1L Clear Bag (Liquids <100ml)", items: [{text: "Clear 1 litre bag", done:false}, {text: "Cologne/Perfume", done:false}, {text: "Toothpaste", done:false}, {text: "Face wash", done:false}, {text: "Shampoo & Conditioner", done:false}, {text: "Leave-in conditioner", done:false}, {text: "Micellar Water/Makeup Remover", done:false}, {text: "Sunscreen", done:false}, {text: "Deodorant", done:false}, {text: "Moisturiser", done:false}] }
    ]
  },
  {
    areaName: "🎒 Personal Item Bag (Under Seat)",
    areaColor: "#8E44AD",
    categories: [
      { title: "Essentials", items: [{text: "TRS Claim + Items", done:false}, {text: "Passport + [Copy + Tracker]", done:false}, {text: "Reservations + Itineraries + Insurance", done:false}, {text: "Wallet/Purse + Local cash + Cards", done:false}, {text: "Phone", done:false}, {text: "Crossbody/Sling Bag", done:false}] },
      { title: "Flight Items", items: [{text: "Travel pillow / Foot sling", done:false}, {text: "Phone holder (watch movies)", done:false}, {text: "Compression socks, Slippers", done:false}, {text: "Disposable Toothbrush kit", done:false}, {text: "Eye mask, Eye Drops", done:false}, {text: "Ear plugs, Breath Fresheners", done:false}, {text: "Snacks, TravelCalm", done:false}, {text: "Headphones/Airpods", done:false}, {text: "Airfly/Bluetooth Adapter", done:false}, {text: "Book/Kindle", done:false}, {text: "Water bottle", done:false}] },
      { title: "Tech", items: [{text: "eSIM (Installed)", done:false}, {text: "Mobile downloads (Movies, Shows)", done:false}, {text: "Phone charger", done:false}, {text: "Power cables, Cords", done:false}, {text: "Power Adapter", done:false}, {text: "Power bank", done:false}, {text: "Pen", done:false}, {text: "Laptop", done:false}, {text: "Luggage Trackers", done:false}] }
    ]
  }
];

function updateClocks() {
  const now = new Date();
  const options = { hour: '2-digit', minute:'2-digit', timeZoneName: 'short' };
  document.getElementById('time-joy').textContent = now.toLocaleTimeString('en-AU', {timeZone: 'Australia/Brisbane', ...options});
  document.getElementById('time-eur').textContent = now.toLocaleTimeString('en-AU', {timeZone: 'Europe/Berlin', ...options});
  document.getElementById('time-tha').textContent = now.toLocaleTimeString('en-AU', {timeZone: 'Asia/Bangkok', ...options});
}

function parseCost(val) { const num = parseFloat(String(val).replace(/[^0-9.-]+/g, "")); return isNaN(num) ? 0 : num; }

function getDayTotal(day) {
  let total = 0;
  ['transportItems', 'accomItems', 'activityItems'].forEach(cat => {
    (day[cat] || []).forEach(item => { total += parseCost(item.cost); });
  });
  return total > 0 ? '$' + total.toFixed(0) : '';
}
