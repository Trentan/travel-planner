const DEFAULT_DATA = [
  {
    id: 'leg-1', label: '📍 Example City', colour: '#2C3E50',
    cityFood: [{ text: "Example local dish to try", done: false }],
    suggestedActivities: [
      { title: 'Morning run in the park', category: 'fitness', estTime: '1 hr', estCost: '0', assignedDayIdx: null },
      { title: 'City History Museum', category: 'sight', estTime: '2 hrs', estCost: '15', assignedDayIdx: null },
      { title: 'Local food market tour', category: 'food', estTime: '2 hrs', estCost: '30', assignedDayIdx: null }
    ],
    legTips: ['Download local transit app'],
    days: [
      {
        date:'1 Jan', day:'Mon', from:'Home', to:'Example City',
        completed: false, desc:'Travel and arrival day',
        transportItems: [{ text: "Flight AA123 08:00", cost: "250", status: "pending", bookingRef: "" }],
        accomItems: [{ text: "Grand Hotel", cost: "120", status: "pending", bookingRef: "" }],
        activityItems: [{ text: "Check-in and explore local area", cost: "0", time: "1 hr", done: false }]
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
  {text: "Lock all doors and windows", done:false},
  {text: "Pause gym membership", done:false},
  {text: "Setup camera for fish and security", done:false},
  {text: "Store/remove fridge & pantry perishables", done:false},
  {text: "Turn off taps, PowerPoints", done:false},
  {text: "Wrap garage door opener and unplug power", done:false}
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
