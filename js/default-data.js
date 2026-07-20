var DEFAULT_TRIP_DATA = {
  "meta": {
    "title": "🌏 New Trip Plan",
    "subtitle": "Click here to add your trip subtitle/description"
  },
  "itinerary": [
    {
      "id": "city-sydney-start",
      "label": "Sydney (Trip Start)",
      "colour": "#34495e",
      "cityFood": [],
      "suggestedActivities": [
        {
          "id": "act-330tudrk3-mrsfaupr",
          "title": "Arrive at Sydney Kingsford Smith Airport",
          "category": "sight",
          "estTime": "07:00 - 08:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 0,
          "assignedDate": "2026-06-01",
          "startDate": "2026-06-01",
          "startTime": "07:00",
          "endDate": "2026-06-01",
          "endTime": "08:00",
          "cityId": "city-tokyo"
        }
      ],
      "legTips": [
        {
          "text": "Pack your passport and all travel documents in your carry-on.",
          "cityId": "city-sydney"
        },
        {
          "text": "Check in online 24 hours before your flight.",
          "cityId": "city-sydney"
        },
        {
          "text": "Arrive at the airport at least 3 hours before international departure.",
          "cityId": "city-sydney"
        }
      ],
      "days": [
        {
          "date": "2026-06-01",
          "day": "Mon",
          "from": "Sydney",
          "to": "Tokyo",
          "completed": false,
          "desc": "Depart Sydney for Tokyo",
          "transportItems": [
            {
              "text": "Qantas Flight QF61 | Dep 10:15 | Arr 19:00 | Sydney → Tokyo",
              "cost": "850",
              "status": "confirmed",
              "fromLocation": "Sydney Kingsford Smith (SYD) - Terminal 1",
              "toLocation": "Tokyo Narita (NRT) - Terminal 2",
              "provider": "Qantas Airways",
              "routeCode": "QF61",
              "bookingRef": "QF88X2"
            }
          ],
          "accomItems": [],
          "activityItems": [
            {
              "text": "Arrive at Sydney Kingsford Smith Airport",
              "time": "07:00 - 08:00",
              "cost": "0",
              "done": false,
              "startTime": "07:00",
              "endTime": "08:00",
              "startDate": "2026-06-01",
              "endDate": "2026-06-01",
              "activityId": "act-330tudrk3-mrsfaupr",
              "cityId": "city-tokyo"
            }
          ]
        }
      ]
    },
    {
      "id": "city-tokyo",
      "label": "🌸 Tokyo",
      "colour": "#e74c3c",
      "cityFood": [
        {
          "text": "Ramen at Ichiran (solo booth, authentic hakata style)",
          "done": false,
          "cityId": "city-tokyo"
        },
        {
          "text": "Sushi breakfast at Tsukiji Outer Market",
          "done": false,
          "cityId": "city-tokyo"
        },
        {
          "text": "Wagyu beef at Matsusaka Don",
          "done": false,
          "cityId": "city-tokyo"
        },
        {
          "text": "Yakitori under the train tracks in Yurakucho",
          "done": false,
          "cityId": "city-tokyo"
        }
      ],
      "legTips": [
        {
          "text": "Get a Suica or Pasmo card for seamless train travel.",
          "cityId": "city-tokyo"
        },
        {
          "text": "Convenience stores (7-Eleven, FamilyMart) sell incredible hot food 24/7.",
          "cityId": "city-tokyo"
        },
        {
          "text": "Most restaurants have plastic food displays outside — point to order if needed.",
          "cityId": "city-tokyo"
        }
      ],
      "suggestedActivities": [
        {
          "title": "Senso-ji Temple & Nakamise Street",
          "category": "sight",
          "estTime": "2 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-1",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Shibuya Crossing & Hachiko Statue",
          "category": "sight",
          "estTime": "10:00 - 12:00",
          "estCost": "0",
          "assignedDayIdx": 2,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-2",
          "assignedDate": "2026-06-04",
          "startDate": "2026-06-04",
          "endDate": "2026-06-04",
          "startTime": "10:00",
          "endTime": "12:00"
        },
        {
          "title": "teamLab Borderless Digital Art Museum",
          "category": "experience",
          "estTime": "3 hrs",
          "estCost": "32",
          "assignedDayIdx": 4,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-3",
          "assignedDate": "2026-06-06",
          "startDate": "2026-06-06",
          "endDate": "2026-06-06",
          "startTime": "13:00",
          "endTime": "16:00"
        },
        {
          "title": "Harajuku & Takeshita Street",
          "category": "sight",
          "estTime": "2 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-4",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Day trip to Nikko Shrines",
          "category": "day-trip",
          "estTime": "8 hrs",
          "estCost": "60",
          "assignedDayIdx": null,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-5",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Robot Restaurant Show",
          "category": "entertainment",
          "estTime": "90 mins",
          "estCost": "80",
          "assignedDayIdx": null,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-6",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Meiji Jingu Shrine",
          "category": "sight",
          "estTime": "1.5 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-7",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Tsukiji Outer Market Breakfast",
          "category": "food",
          "estTime": "2 hrs",
          "estCost": "20",
          "assignedDayIdx": 4,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-8",
          "assignedDate": "2026-06-06",
          "startDate": "2026-06-06",
          "endDate": "2026-06-06",
          "startTime": "07:30",
          "endTime": "09:30"
        },
        {
          "title": "Akihabara Electronics District",
          "category": "shopping",
          "estTime": "2 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-tokyo",
          "id": "act-sug-tokyo-9",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "id": "act-hu4o3nsbi-mrsfaupt",
          "title": "Check in, freshen up, explore Shinjuku at night",
          "category": "sight",
          "estTime": "20:00 - 22:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 0,
          "assignedDate": "2026-06-01",
          "startDate": "2026-06-01",
          "startTime": "20:00",
          "endDate": "2026-06-01",
          "endTime": "22:00",
          "cityId": "city-tokyo"
        },
        {
          "id": "act-l5v4stu87-mrsfaupu",
          "title": "Senso-ji Temple in Asakusa",
          "category": "sight",
          "estTime": "09:00 - 11:30",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 1,
          "assignedDate": "2026-06-03",
          "startDate": "2026-06-03",
          "startTime": "09:00",
          "endDate": "2026-06-03",
          "endTime": "11:30",
          "cityId": "city-tokyo"
        },
        {
          "id": "act-cbllder05-mrsfaupu",
          "title": "Akihabara Electronics & Anime District",
          "category": "sight",
          "estTime": "14:00 - 17:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 1,
          "assignedDate": "2026-06-03",
          "startDate": "2026-06-03",
          "startTime": "14:00",
          "endDate": "2026-06-03",
          "endTime": "17:00",
          "cityId": "city-tokyo"
        },
        {
          "id": "act-le4v3iv7j-mrsfaupu",
          "title": "Harajuku Takeshita Street & Meiji Shrine",
          "category": "sight",
          "estTime": "13:30 - 16:30",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 2,
          "assignedDate": "2026-06-04",
          "startDate": "2026-06-04",
          "startTime": "13:30",
          "endDate": "2026-06-04",
          "endTime": "16:30",
          "cityId": "city-tokyo"
        },
        {
          "id": "act-a11ssesur-mrsfaupu",
          "title": "Nikko Tosho-gu Shrine Complex (UNESCO)",
          "category": "sight",
          "estTime": "09:00 - 17:00",
          "estCost": "60",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 3,
          "assignedDate": "2026-06-05",
          "startDate": "2026-06-05",
          "startTime": "09:00",
          "endDate": "2026-06-05",
          "endTime": "17:00",
          "cityId": "city-tokyo"
        },
        {
          "id": "act-s91l9g2dk-mrsfaupv",
          "title": "Kegon Waterfall",
          "category": "sight",
          "estTime": "11:00 - 12:00",
          "estCost": "8",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 3,
          "assignedDate": "2026-06-05",
          "startDate": "2026-06-05",
          "startTime": "11:00",
          "endDate": "2026-06-05",
          "endTime": "12:00",
          "cityId": "city-tokyo"
        },
        {
          "id": "act-s35mhrqzb-mrsfaupw",
          "title": "Transfer to Haneda Airport",
          "category": "sight",
          "estTime": "07:00 - 08:30",
          "estCost": "30",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 5,
          "assignedDate": "2026-06-07",
          "startDate": "2026-06-07",
          "startTime": "07:00",
          "endDate": "2026-06-07",
          "endTime": "08:30",
          "cityId": "city-tokyo"
        }
      ],
      "days": [
        {
          "date": "2026-06-01",
          "day": "Mon",
          "from": "Sydney",
          "to": "Tokyo",
          "completed": false,
          "desc": "Arrive in Tokyo, evening check-in",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Shinjuku Prince Hotel",
              "cost": "150",
              "status": "confirmed",
              "provider": "Booking.com",
              "cityId": "city-tokyo",
              "location": "1-30-1 Kabukicho, Shinjuku City",
              "checkInTime": "20:00",
              "checkOutTime": "11:00",
              "bookingRef": "BK-TYO-2847"
            }
          ],
          "activityItems": [
            {
              "text": "Check in, freshen up, explore Shinjuku at night",
              "time": "20:00 - 22:00",
              "cost": "0",
              "done": false,
              "startTime": "20:00",
              "endTime": "22:00",
              "startDate": "2026-06-01",
              "endDate": "2026-06-01",
              "activityId": "act-hu4o3nsbi-mrsfaupt",
              "cityId": "city-tokyo"
            }
          ]
        },
        {
          "date": "2026-06-03",
          "day": "Wed",
          "from": "Tokyo",
          "to": "Tokyo",
          "completed": false,
          "desc": "Senso-ji & Akihabara",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Shinjuku Prince Hotel",
              "cost": "150",
              "status": "confirmed",
              "provider": "Booking.com",
              "cityId": "city-tokyo",
              "location": "1-30-1 Kabukicho, Shinjuku City",
              "checkInTime": "15:00",
              "checkOutTime": "11:00",
              "bookingRef": "BK-TYO-2847"
            }
          ],
          "activityItems": [
            {
              "text": "Senso-ji Temple in Asakusa",
              "time": "09:00 - 11:30",
              "cost": "0",
              "done": false,
              "startTime": "09:00",
              "endTime": "11:30",
              "startDate": "2026-06-03",
              "endDate": "2026-06-03",
              "activityId": "act-l5v4stu87-mrsfaupu",
              "cityId": "city-tokyo"
            },
            {
              "text": "Akihabara Electronics & Anime District",
              "time": "14:00 - 17:00",
              "cost": "0",
              "done": false,
              "startTime": "14:00",
              "endTime": "17:00",
              "startDate": "2026-06-03",
              "endDate": "2026-06-03",
              "activityId": "act-cbllder05-mrsfaupu",
              "cityId": "city-tokyo"
            }
          ]
        },
        {
          "date": "2026-06-04",
          "day": "Thu",
          "from": "Tokyo",
          "to": "Tokyo",
          "completed": false,
          "desc": "Shibuya & Harajuku",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Shinjuku Prince Hotel",
              "cost": "150",
              "status": "confirmed",
              "provider": "Booking.com",
              "cityId": "city-tokyo",
              "location": "1-30-1 Kabukicho, Shinjuku City",
              "checkInTime": "15:00",
              "checkOutTime": "11:00",
              "bookingRef": "BK-TYO-2847"
            }
          ],
          "activityItems": [
            {
              "text": "Shibuya Crossing & Hachiko Statue",
              "time": "10:00 - 12:00",
              "cost": "0",
              "done": false,
              "startTime": "10:00",
              "endTime": "12:00",
              "startDate": "2026-06-04",
              "endDate": "2026-06-04",
              "activityId": "act-sug-tokyo-2",
              "cityId": "city-tokyo"
            },
            {
              "text": "Harajuku Takeshita Street & Meiji Shrine",
              "time": "13:30 - 16:30",
              "cost": "0",
              "done": false,
              "startTime": "13:30",
              "endTime": "16:30",
              "startDate": "2026-06-04",
              "endDate": "2026-06-04",
              "activityId": "act-le4v3iv7j-mrsfaupu",
              "cityId": "city-tokyo"
            }
          ]
        },
        {
          "date": "2026-06-05",
          "day": "Fri",
          "from": "Tokyo",
          "to": "Tokyo",
          "completed": false,
          "desc": "Day trip to Nikko",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Shinjuku Prince Hotel",
              "cost": "150",
              "status": "confirmed",
              "provider": "Booking.com",
              "cityId": "city-tokyo",
              "location": "1-30-1 Kabukicho, Shinjuku City",
              "checkInTime": "15:00",
              "checkOutTime": "11:00",
              "bookingRef": "BK-TYO-2847"
            }
          ],
          "activityItems": [
            {
              "text": "Nikko Tosho-gu Shrine Complex (UNESCO)",
              "time": "09:00 - 17:00",
              "cost": "60",
              "done": false,
              "startTime": "09:00",
              "endTime": "17:00",
              "startDate": "2026-06-05",
              "endDate": "2026-06-05",
              "activityId": "act-a11ssesur-mrsfaupu",
              "cityId": "city-tokyo"
            },
            {
              "text": "Kegon Waterfall",
              "time": "11:00 - 12:00",
              "cost": "8",
              "done": false,
              "startTime": "11:00",
              "endTime": "12:00",
              "startDate": "2026-06-05",
              "endDate": "2026-06-05",
              "activityId": "act-s91l9g2dk-mrsfaupv",
              "cityId": "city-tokyo"
            }
          ]
        },
        {
          "date": "2026-06-06",
          "day": "Sat",
          "from": "Tokyo",
          "to": "Tokyo",
          "completed": false,
          "desc": "Tsukiji & Ginza",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Shinjuku Prince Hotel",
              "cost": "150",
              "status": "confirmed",
              "provider": "Booking.com",
              "cityId": "city-tokyo",
              "location": "1-30-1 Kabukicho, Shinjuku City",
              "checkInTime": "15:00",
              "checkOutTime": "11:00",
              "bookingRef": "BK-TYO-2847"
            }
          ],
          "activityItems": [
            {
              "text": "Tsukiji Outer Market breakfast",
              "time": "07:30 - 09:30",
              "cost": "20",
              "done": false,
              "startTime": "07:30",
              "endTime": "09:30",
              "startDate": "2026-06-06",
              "endDate": "2026-06-06",
              "activityId": "act-sug-tokyo-8",
              "cityId": "city-tokyo"
            },
            {
              "text": "teamLab Borderless Digital Art Museum",
              "time": "13:00 - 16:00",
              "cost": "32",
              "done": false,
              "startTime": "13:00",
              "endTime": "16:00",
              "startDate": "2026-06-06",
              "endDate": "2026-06-06",
              "activityId": "act-sug-tokyo-3",
              "cityId": "city-tokyo"
            }
          ]
        },
        {
          "date": "2026-06-07",
          "day": "Sun",
          "from": "Tokyo",
          "to": "London",
          "completed": false,
          "desc": "Depart Tokyo for London",
          "transportItems": [
            {
              "text": "British Airways Flight BA8 | Dep 09:35 | Arr 16:10 | Tokyo → London",
              "cost": "1100",
              "status": "confirmed",
              "fromLocation": "Tokyo Haneda (HND) - Terminal 3",
              "toLocation": "London Heathrow (LHR) - Terminal 5",
              "provider": "British Airways",
              "routeCode": "BA8",
              "bookingRef": "BA-TYO-991"
            }
          ],
          "accomItems": [],
          "activityItems": [
            {
              "text": "Transfer to Haneda Airport",
              "time": "07:00 - 08:30",
              "cost": "30",
              "done": false,
              "startTime": "07:00",
              "endTime": "08:30",
              "startDate": "2026-06-07",
              "endDate": "2026-06-07",
              "activityId": "act-s35mhrqzb-mrsfaupw",
              "cityId": "city-london"
            }
          ]
        }
      ]
    },
    {
      "id": "city-london",
      "label": "🏰 London",
      "colour": "#2980b9",
      "cityFood": [
        {
          "text": "Fish & Chips at Poppies Fish & Chips (Spitalfields)",
          "done": false,
          "cityId": "city-london"
        },
        {
          "text": "Full English Breakfast at a classic caff",
          "done": false,
          "cityId": "city-london"
        },
        {
          "text": "Afternoon Tea at The Ritz or Fortnum & Mason",
          "done": false,
          "cityId": "city-london"
        }
      ],
      "legTips": [
        {
          "text": "Get an Oyster card or use contactless for Tube and buses.",
          "cityId": "city-london"
        },
        {
          "text": "Most museums (British Museum, National Gallery, V&A) are free.",
          "cityId": "city-london"
        },
        {
          "text": "Book the London Eye and popular attractions in advance online.",
          "cityId": "city-london"
        }
      ],
      "suggestedActivities": [
        {
          "title": "Tower of London & Crown Jewels",
          "category": "sight",
          "estTime": "3 hrs",
          "estCost": "30",
          "assignedDayIdx": 1,
          "cityId": "city-london",
          "id": "act-sug-lon-1",
          "assignedDate": "2026-06-08",
          "startDate": "2026-06-08",
          "endDate": "2026-06-08",
          "startTime": "09:30",
          "endTime": "12:30"
        },
        {
          "title": "British Museum (Rosetta Stone)",
          "category": "sight",
          "estTime": "3 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-london",
          "id": "act-sug-lon-2",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Buckingham Palace & Changing of the Guard",
          "category": "sight",
          "estTime": "2 hrs",
          "estCost": "0",
          "assignedDayIdx": 2,
          "cityId": "city-london",
          "id": "act-sug-lon-3",
          "assignedDate": "2026-06-09",
          "startDate": "2026-06-09",
          "endDate": "2026-06-09",
          "startTime": "10:00",
          "endTime": "11:30"
        },
        {
          "title": "Walk South Bank: Borough Market to Tate Modern",
          "category": "sight",
          "estTime": "3 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-london",
          "id": "act-sug-lon-4",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Day Trip to Windsor Castle",
          "category": "day-trip",
          "estTime": "6 hrs",
          "estCost": "28",
          "assignedDayIdx": null,
          "cityId": "city-london",
          "id": "act-sug-lon-5",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Camden Market",
          "category": "shopping",
          "estTime": "2 hrs",
          "estCost": "20",
          "assignedDayIdx": 3,
          "cityId": "city-london",
          "id": "act-sug-lon-6",
          "assignedDate": "2026-06-10",
          "startDate": "2026-06-10",
          "endDate": "2026-06-10",
          "startTime": "14:30",
          "endTime": "17:30",
          "location": "vintage & street food"
        },
        {
          "title": "Westminster Abbey & Big Ben",
          "category": "sight",
          "estTime": "2.5 hrs",
          "estCost": "27",
          "assignedDayIdx": 2,
          "cityId": "city-london",
          "id": "act-sug-lon-7",
          "assignedDate": "2026-06-09",
          "startDate": "2026-06-09",
          "endDate": "2026-06-09",
          "startTime": "13:00",
          "endTime": "15:30"
        },
        {
          "title": "Natural History Museum",
          "category": "sight",
          "estTime": "2.5 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-london",
          "id": "act-sug-lon-8",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Notting Hill & Portobello Road",
          "category": "sight",
          "estTime": "2 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-london",
          "id": "act-sug-lon-9",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "id": "act-9ap5hid1b-mrsfaupx",
          "title": "Check in to The Hoxton, Shoreditch",
          "category": "sight",
          "estTime": "17:00 - 18:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 0,
          "assignedDate": "2026-06-07",
          "startDate": "2026-06-07",
          "startTime": "17:00",
          "endDate": "2026-06-07",
          "endTime": "18:00",
          "cityId": "city-london"
        },
        {
          "id": "act-m7llyxq1v-mrsfaupx",
          "title": "Evening stroll along the Thames",
          "category": "sight",
          "estTime": "19:30 - 21:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 0,
          "assignedDate": "2026-06-07",
          "startDate": "2026-06-07",
          "startTime": "19:30",
          "endDate": "2026-06-07",
          "endTime": "21:00",
          "cityId": "city-london"
        },
        {
          "id": "act-6nybd1snf-mrsfaupx",
          "title": "Borough Market & South Bank walk to Tate Modern",
          "category": "sight",
          "estTime": "13:30 - 16:30",
          "estCost": "15",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 1,
          "assignedDate": "2026-06-08",
          "startDate": "2026-06-08",
          "startTime": "13:30",
          "endDate": "2026-06-08",
          "endTime": "16:30",
          "cityId": "city-london"
        },
        {
          "id": "act-wsx2c6wmv-mrsfaupx",
          "title": "British Museum (free)",
          "category": "sight",
          "estTime": "09:30 - 13:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 3,
          "assignedDate": "2026-06-10",
          "startDate": "2026-06-10",
          "startTime": "09:30",
          "endDate": "2026-06-10",
          "endTime": "13:00",
          "cityId": "city-london"
        },
        {
          "id": "act-n78h9dlu4-mrsfaupy",
          "title": "St Pancras International",
          "category": "sight",
          "estTime": "09:00 - 10:00",
          "estCost": "0",
          "notes": "",
          "location": "enjoy the Grand Terrace before boarding",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 4,
          "assignedDate": "2026-06-11",
          "startDate": "2026-06-11",
          "startTime": "09:00",
          "endDate": "2026-06-11",
          "endTime": "10:00",
          "cityId": "city-london"
        }
      ],
      "days": [
        {
          "date": "2026-06-07",
          "day": "Sun",
          "from": "Tokyo",
          "to": "London",
          "completed": false,
          "desc": "Arrive in London",
          "transportItems": [],
          "accomItems": [
            {
              "text": "The Hoxton, Shoreditch",
              "cost": "250",
              "status": "confirmed",
              "provider": "Hoxton Direct",
              "cityId": "city-london",
              "location": "81 Great Eastern St, London",
              "checkInTime": "14:00",
              "checkOutTime": "12:00",
              "bookingRef": "HOX-97321"
            }
          ],
          "activityItems": [
            {
              "text": "Check in to The Hoxton, Shoreditch",
              "time": "17:00 - 18:00",
              "cost": "0",
              "done": false,
              "startTime": "17:00",
              "endTime": "18:00",
              "startDate": "2026-06-07",
              "endDate": "2026-06-07",
              "activityId": "act-9ap5hid1b-mrsfaupx",
              "cityId": "city-london"
            },
            {
              "text": "Evening stroll along the Thames",
              "time": "19:30 - 21:00",
              "cost": "0",
              "done": false,
              "startTime": "19:30",
              "endTime": "21:00",
              "startDate": "2026-06-07",
              "endDate": "2026-06-07",
              "activityId": "act-m7llyxq1v-mrsfaupx",
              "cityId": "city-london"
            }
          ]
        },
        {
          "date": "2026-06-08",
          "day": "Mon",
          "from": "London",
          "to": "London",
          "completed": false,
          "desc": "Tower of London & South Bank",
          "transportItems": [],
          "accomItems": [
            {
              "text": "The Hoxton, Shoreditch",
              "cost": "250",
              "status": "confirmed",
              "provider": "Hoxton Direct",
              "cityId": "city-london",
              "location": "81 Great Eastern St, London",
              "checkInTime": "14:00",
              "checkOutTime": "12:00",
              "bookingRef": "HOX-97321"
            }
          ],
          "activityItems": [
            {
              "text": "Tower of London & Crown Jewels",
              "time": "09:30 - 12:30",
              "cost": "30",
              "done": false,
              "startTime": "09:30",
              "endTime": "12:30",
              "startDate": "2026-06-08",
              "endDate": "2026-06-08",
              "activityId": "act-sug-lon-1",
              "cityId": "city-london"
            },
            {
              "text": "Borough Market & South Bank walk to Tate Modern",
              "time": "13:30 - 16:30",
              "cost": "15",
              "done": false,
              "startTime": "13:30",
              "endTime": "16:30",
              "startDate": "2026-06-08",
              "endDate": "2026-06-08",
              "activityId": "act-6nybd1snf-mrsfaupx",
              "cityId": "city-london"
            }
          ]
        },
        {
          "date": "2026-06-09",
          "day": "Tue",
          "from": "London",
          "to": "London",
          "completed": false,
          "desc": "Buckingham Palace & Westminster",
          "transportItems": [],
          "accomItems": [
            {
              "text": "The Hoxton, Shoreditch",
              "cost": "250",
              "status": "confirmed",
              "provider": "Hoxton Direct",
              "cityId": "city-london",
              "location": "81 Great Eastern St, London",
              "checkInTime": "14:00",
              "checkOutTime": "12:00",
              "bookingRef": "HOX-97321"
            }
          ],
          "activityItems": [
            {
              "text": "Buckingham Palace (Changing of the Guard)",
              "time": "10:00 - 11:30",
              "cost": "0",
              "done": false,
              "startTime": "10:00",
              "endTime": "11:30",
              "startDate": "2026-06-09",
              "endDate": "2026-06-09",
              "activityId": "act-sug-lon-3",
              "cityId": "city-london"
            },
            {
              "text": "Westminster Abbey & Big Ben",
              "time": "13:00 - 15:30",
              "cost": "27",
              "done": false,
              "startTime": "13:00",
              "endTime": "15:30",
              "startDate": "2026-06-09",
              "endDate": "2026-06-09",
              "activityId": "act-sug-lon-7",
              "cityId": "city-london"
            }
          ]
        },
        {
          "date": "2026-06-10",
          "day": "Wed",
          "from": "London",
          "to": "London",
          "completed": false,
          "desc": "British Museum & Camden",
          "transportItems": [],
          "accomItems": [
            {
              "text": "The Hoxton, Shoreditch",
              "cost": "250",
              "status": "confirmed",
              "provider": "Hoxton Direct",
              "cityId": "city-london",
              "location": "81 Great Eastern St, London",
              "checkInTime": "14:00",
              "checkOutTime": "12:00",
              "bookingRef": "HOX-97321"
            }
          ],
          "activityItems": [
            {
              "text": "British Museum (free)",
              "time": "09:30 - 13:00",
              "cost": "0",
              "done": false,
              "startTime": "09:30",
              "endTime": "13:00",
              "startDate": "2026-06-10",
              "endDate": "2026-06-10",
              "activityId": "act-wsx2c6wmv-mrsfaupx",
              "cityId": "city-london"
            },
            {
              "text": "Camden Market — vintage & street food",
              "time": "14:30 - 17:30",
              "cost": "20",
              "done": false,
              "startTime": "14:30",
              "endTime": "17:30",
              "startDate": "2026-06-10",
              "endDate": "2026-06-10",
              "activityId": "act-sug-lon-6",
              "location": "vintage & street food",
              "cityId": "city-london"
            }
          ]
        },
        {
          "date": "2026-06-11",
          "day": "Thu",
          "from": "London",
          "to": "Paris",
          "completed": false,
          "desc": "Depart London to Paris by Eurostar",
          "transportItems": [
            {
              "text": "Eurostar Train | Dep 10:30 | Arr 13:47 | London → Paris",
              "cost": "120",
              "status": "confirmed",
              "fromLocation": "London St Pancras International",
              "toLocation": "Paris Gare du Nord",
              "provider": "Eurostar",
              "routeCode": "ES9014",
              "bookingRef": "ES-44812"
            }
          ],
          "accomItems": [],
          "activityItems": [
            {
              "text": "St Pancras International — enjoy the Grand Terrace before boarding",
              "time": "09:00 - 10:00",
              "cost": "0",
              "done": false,
              "startTime": "09:00",
              "endTime": "10:00",
              "startDate": "2026-06-11",
              "endDate": "2026-06-11",
              "location": "enjoy the Grand Terrace before boarding",
              "activityId": "act-n78h9dlu4-mrsfaupy",
              "cityId": "city-paris"
            }
          ]
        }
      ]
    },
    {
      "id": "city-paris",
      "label": "🥐 Paris",
      "colour": "#8e44ad",
      "cityFood": [
        {
          "text": "Fresh croissant from a local boulangerie",
          "done": false,
          "cityId": "city-paris"
        },
        {
          "text": "Macarons from Pierre Hermé",
          "done": false,
          "cityId": "city-paris"
        },
        {
          "text": "Steak Frites at Le Relais de l'Entrecôte",
          "done": false,
          "cityId": "city-paris"
        }
      ],
      "legTips": [
        {
          "text": "Learn a few basic French phrases — even just Bonjour and Merci.",
          "cityId": "city-paris"
        },
        {
          "text": "Beware of pickpockets around major tourist sites like the Eiffel Tower.",
          "cityId": "city-paris"
        },
        {
          "text": "The Paris Museum Pass covers 50+ museums — great value if you plan ahead.",
          "cityId": "city-paris"
        }
      ],
      "suggestedActivities": [
        {
          "title": "Eiffel Tower at Sunset",
          "category": "sight",
          "estTime": "2 hrs",
          "estCost": "26",
          "assignedDayIdx": null,
          "cityId": "city-paris",
          "id": "act-sug-par-1",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Louvre Museum (Mona Lisa & Venus de Milo)",
          "category": "sight",
          "estTime": "4 hrs",
          "estCost": "22",
          "assignedDayIdx": null,
          "cityId": "city-paris",
          "id": "act-sug-par-2",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Montmartre & Sacré-Cœur Basilica",
          "category": "sight",
          "estTime": "3 hrs",
          "estCost": "0",
          "assignedDayIdx": 1,
          "cityId": "city-paris",
          "id": "act-sug-par-3",
          "assignedDate": "2026-06-12",
          "startDate": "2026-06-12",
          "endDate": "2026-06-12",
          "startTime": "15:00",
          "endTime": "18:00"
        },
        {
          "title": "Versailles Palace & Gardens",
          "category": "day-trip",
          "estTime": "6 hrs",
          "estCost": "25",
          "assignedDayIdx": null,
          "cityId": "city-paris",
          "id": "act-sug-par-4",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Seine River Cruise",
          "category": "tour",
          "estTime": "1.5 hrs",
          "estCost": "20",
          "assignedDayIdx": null,
          "cityId": "city-paris",
          "id": "act-sug-par-5",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Notre-Dame Cathedral & Île de la Cité",
          "category": "sight",
          "estTime": "2 hrs",
          "estCost": "0",
          "assignedDayIdx": null,
          "cityId": "city-paris",
          "id": "act-sug-par-6",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Musée d'Orsay (Impressionists)",
          "category": "sight",
          "estTime": "3 hrs",
          "estCost": "16",
          "assignedDayIdx": null,
          "cityId": "city-paris",
          "id": "act-sug-par-7",
          "assignedDate": "",
          "startDate": "",
          "endDate": "",
          "startTime": "",
          "endTime": ""
        },
        {
          "title": "Champs-Élysées & Arc de Triomphe",
          "category": "sight",
          "estTime": "2 hrs",
          "estCost": "13",
          "assignedDayIdx": 2,
          "cityId": "city-paris",
          "id": "act-sug-par-8",
          "assignedDate": "2026-06-13",
          "startDate": "2026-06-13",
          "endDate": "2026-06-13",
          "startTime": "15:00",
          "endTime": "17:30"
        },
        {
          "id": "act-kesfj3vud-mrsfaupy",
          "title": "Check in to Hotel Le Walt",
          "category": "sight",
          "estTime": "15:00 - 16:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 0,
          "assignedDate": "2026-06-11",
          "startDate": "2026-06-11",
          "startTime": "15:00",
          "endDate": "2026-06-11",
          "endTime": "16:00",
          "cityId": "city-paris"
        },
        {
          "id": "act-lsn62lxp6-mrsfaupz",
          "title": "Eiffel Tower at golden hour",
          "category": "sight",
          "estTime": "19:30 - 21:00",
          "estCost": "26",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 0,
          "assignedDate": "2026-06-11",
          "startDate": "2026-06-11",
          "startTime": "19:30",
          "endDate": "2026-06-11",
          "endTime": "21:00",
          "cityId": "city-paris"
        },
        {
          "id": "act-6stxic9c6-mrsfauq0",
          "title": "Louvre Museum (Mona Lisa)",
          "category": "sight",
          "estTime": "09:00 - 13:00",
          "estCost": "22",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 1,
          "assignedDate": "2026-06-12",
          "startDate": "2026-06-12",
          "startTime": "09:00",
          "endDate": "2026-06-12",
          "endTime": "13:00",
          "cityId": "city-paris"
        },
        {
          "id": "act-th599dpzx-mrsfauq0",
          "title": "Notre-Dame Cathedral & Latin Quarter walk",
          "category": "sight",
          "estTime": "10:00 - 13:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 2,
          "assignedDate": "2026-06-13",
          "startDate": "2026-06-13",
          "startTime": "10:00",
          "endDate": "2026-06-13",
          "endTime": "13:00",
          "cityId": "city-paris"
        },
        {
          "id": "act-jgune9m91-mrsfauq0",
          "title": "Seine River Cruise (last morning in Paris)",
          "category": "sight",
          "estTime": "10:00 - 11:30",
          "estCost": "20",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 3,
          "assignedDate": "2026-06-14",
          "startDate": "2026-06-14",
          "startTime": "10:00",
          "endDate": "2026-06-14",
          "endTime": "11:30",
          "cityId": "city-paris"
        },
        {
          "id": "act-55gu1kz5f-mrsfauq0",
          "title": "Transfer to Charles de Gaulle Airport",
          "category": "sight",
          "estTime": "18:00 - 19:30",
          "estCost": "25",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 3,
          "assignedDate": "2026-06-14",
          "startDate": "2026-06-14",
          "startTime": "18:00",
          "endDate": "2026-06-14",
          "endTime": "19:30",
          "cityId": "city-paris"
        }
      ],
      "days": [
        {
          "date": "2026-06-11",
          "day": "Thu",
          "from": "London",
          "to": "Paris",
          "completed": false,
          "desc": "Arrive in Paris",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Hotel Le Walt",
              "cost": "280",
              "status": "confirmed",
              "provider": "Hotels.com",
              "cityId": "city-paris",
              "location": "37 Avenue de la Motte-Picquet, Paris",
              "checkInTime": "15:00",
              "checkOutTime": "12:00",
              "bookingRef": "HLW-PAR-5512"
            }
          ],
          "activityItems": [
            {
              "text": "Check in to Hotel Le Walt",
              "time": "15:00 - 16:00",
              "cost": "0",
              "done": false,
              "startTime": "15:00",
              "endTime": "16:00",
              "startDate": "2026-06-11",
              "endDate": "2026-06-11",
              "activityId": "act-kesfj3vud-mrsfaupy",
              "cityId": "city-paris"
            },
            {
              "text": "Eiffel Tower at golden hour",
              "time": "19:30 - 21:00",
              "cost": "26",
              "done": false,
              "startTime": "19:30",
              "endTime": "21:00",
              "startDate": "2026-06-11",
              "endDate": "2026-06-11",
              "activityId": "act-lsn62lxp6-mrsfaupz",
              "cityId": "city-paris"
            }
          ]
        },
        {
          "date": "2026-06-12",
          "day": "Fri",
          "from": "Paris",
          "to": "Paris",
          "completed": false,
          "desc": "Louvre & Montmartre",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Hotel Le Walt",
              "cost": "280",
              "status": "confirmed",
              "provider": "Hotels.com",
              "cityId": "city-paris",
              "location": "37 Avenue de la Motte-Picquet, Paris",
              "checkInTime": "15:00",
              "checkOutTime": "12:00",
              "bookingRef": "HLW-PAR-5512"
            }
          ],
          "activityItems": [
            {
              "text": "Louvre Museum (Mona Lisa)",
              "time": "09:00 - 13:00",
              "cost": "22",
              "done": false,
              "startTime": "09:00",
              "endTime": "13:00",
              "startDate": "2026-06-12",
              "endDate": "2026-06-12",
              "activityId": "act-6stxic9c6-mrsfauq0",
              "cityId": "city-paris"
            },
            {
              "text": "Montmartre & Sacré-Cœur Basilica",
              "time": "15:00 - 18:00",
              "cost": "0",
              "done": false,
              "startTime": "15:00",
              "endTime": "18:00",
              "startDate": "2026-06-12",
              "endDate": "2026-06-12",
              "activityId": "act-sug-par-3",
              "cityId": "city-paris"
            }
          ]
        },
        {
          "date": "2026-06-13",
          "day": "Sat",
          "from": "Paris",
          "to": "Paris",
          "completed": false,
          "desc": "Notre-Dame & Champs-Élysées",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Hotel Le Walt",
              "cost": "280",
              "status": "confirmed",
              "provider": "Hotels.com",
              "cityId": "city-paris",
              "location": "37 Avenue de la Motte-Picquet, Paris",
              "checkInTime": "15:00",
              "checkOutTime": "12:00",
              "bookingRef": "HLW-PAR-5512"
            }
          ],
          "activityItems": [
            {
              "text": "Notre-Dame Cathedral & Latin Quarter walk",
              "time": "10:00 - 13:00",
              "cost": "0",
              "done": false,
              "startTime": "10:00",
              "endTime": "13:00",
              "startDate": "2026-06-13",
              "endDate": "2026-06-13",
              "activityId": "act-th599dpzx-mrsfauq0",
              "cityId": "city-paris"
            },
            {
              "text": "Champs-Élysées & Arc de Triomphe",
              "time": "15:00 - 17:30",
              "cost": "13",
              "done": false,
              "startTime": "15:00",
              "endTime": "17:30",
              "startDate": "2026-06-13",
              "endDate": "2026-06-13",
              "activityId": "act-sug-par-8",
              "cityId": "city-paris"
            }
          ]
        },
        {
          "date": "2026-06-14",
          "day": "Sun",
          "from": "Paris",
          "to": "Dubai",
          "completed": false,
          "desc": "Last day in Paris, evening flight to Dubai",
          "transportItems": [
            {
              "text": "Emirates EK76 / EK412 | Dep 21:55 | Arr +1 06:35 | Paris → Dubai",
              "cost": "750",
              "status": "confirmed",
              "fromLocation": "Paris Charles de Gaulle (CDG) - Terminal 2C",
              "toLocation": "Dubai International (DXB) - Terminal 3",
              "provider": "Emirates",
              "routeCode": "EK76",
              "bookingRef": "EK-CDG-7712"
            }
          ],
          "accomItems": [],
          "activityItems": [
            {
              "text": "Seine River Cruise (last morning in Paris)",
              "time": "10:00 - 11:30",
              "cost": "20",
              "done": false,
              "startTime": "10:00",
              "endTime": "11:30",
              "startDate": "2026-06-14",
              "endDate": "2026-06-14",
              "activityId": "act-jgune9m91-mrsfauq0",
              "cityId": "city-dubai"
            },
            {
              "text": "Transfer to Charles de Gaulle Airport",
              "time": "18:00 - 19:30",
              "cost": "25",
              "done": false,
              "startTime": "18:00",
              "endTime": "19:30",
              "startDate": "2026-06-14",
              "endDate": "2026-06-14",
              "activityId": "act-55gu1kz5f-mrsfauq0",
              "cityId": "city-dubai"
            }
          ]
        }
      ]
    },
    {
      "id": "city-dubai",
      "label": "🐪 Dubai",
      "colour": "#808080",
      "cityFood": [],
      "legTips": [
        {
          "text": "Dress modestly in public areas and shopping malls.",
          "cityId": "city-dubai"
        },
        {
          "text": "The Dubai Metro Gold Line connects the airport to the city centre.",
          "cityId": "city-dubai"
        }
      ],
      "suggestedActivities": [],
      "days": [
        {
          "date": "2026-06-15",
          "day": "Mon",
          "from": "Paris",
          "to": "Sydney",
          "completed": false,
          "desc": "In transit via Dubai",
          "transportItems": [],
          "accomItems": [],
          "activityItems": []
        }
      ]
    },
    {
      "id": "city-dubai",
      "label": "🐪 Dubai",
      "colour": "#f39c12",
      "cityFood": [],
      "suggestedActivities": [],
      "legTips": [],
      "days": [
        {
          "date": "2026-06-15",
          "day": "Mon",
          "from": "Paris",
          "to": "Dubai",
          "completed": false,
          "desc": "Arrive in Dubai for a 1-night stopover",
          "transportItems": [],
          "accomItems": [
            {
              "text": "Dubai Airport Transit Hotel",
              "cost": "150",
              "status": "confirmed",
              "provider": "Booking.com",
              "cityId": "city-dubai",
              "location": "Terminal 3, Dubai International Airport",
              "checkInTime": "14:00",
              "checkOutTime": "12:00",
              "bookingRef": "BK-DXB-0142"
            }
          ],
          "activityItems": [
            {
              "text": "Burj Khalifa & Dubai Mall Fountain Show",
              "time": "17:00 - 20:00",
              "cost": "50",
              "done": false,
              "startTime": "17:00",
              "endTime": "20:00",
              "startDate": "2026-06-15",
              "endDate": "2026-06-15",
              "activityId": "act-85hq5ujjb-mrsfauq0",
              "cityId": "city-dubai"
            }
          ]
        },
        {
          "date": "2026-06-16",
          "day": "Tue",
          "from": "Dubai",
          "to": "Sydney",
          "completed": false,
          "desc": "Depart Dubai for Sydney",
          "transportItems": [],
          "accomItems": [],
          "activityItems": []
        }
      ]
    },
    {
      "id": "city-sydney-end",
      "label": "🛬 Sydney (Return)",
      "colour": "#27ae60",
      "cityFood": [],
      "suggestedActivities": [
        {
          "id": "act-bihgj09qb-mrsfauq0",
          "title": "Welcome home! Clear customs and head home.",
          "category": "sight",
          "estTime": "06:00 - 09:00",
          "estCost": "0",
          "notes": "",
          "location": "",
          "status": "",
          "bookingRef": "",
          "externalLink": "",
          "assignedDayIdx": 0,
          "assignedDate": "2026-06-18",
          "startDate": "2026-06-18",
          "startTime": "06:00",
          "endDate": "2026-06-18",
          "endTime": "09:00",
          "cityId": "city-sydney"
        }
      ],
      "legTips": [
        {
          "text": "Declare all food items at Australian customs — heavy fines apply.",
          "cityId": "city-sydney"
        },
        {
          "text": "The Airport Link train gets you from the airport to the CBD in 13 minutes.",
          "cityId": "city-sydney"
        }
      ],
      "days": [
        {
          "date": "2026-06-17",
          "day": "Wed",
          "from": "Dubai",
          "to": "Sydney",
          "completed": false,
          "desc": "Arrive home in Sydney!",
          "transportItems": [],
          "accomItems": [],
          "activityItems": [
            {
              "text": "Welcome home! Clear customs and head home.",
              "time": "06:00 - 09:00",
              "cost": "0",
              "done": false,
              "startTime": "06:00",
              "endTime": "09:00",
              "startDate": "2026-06-17",
              "endDate": "2026-06-17",
              "activityId": "act-bihgj09qb-mrsfauq0",
              "cityId": "city-sydney"
            }
          ]
        }
      ]
    }
  ],
  "packing": [
    {
      "areaName": "🚶 Walk-on Gear (Wear onto plane)",
      "areaColor": "#E67E22",
      "categories": [
        {
          "title": "Plane Outfit",
          "items": [
            {
              "text": "Underwear",
              "done": false
            },
            {
              "text": "Jeans",
              "done": false
            },
            {
              "text": "Belt",
              "done": false
            },
            {
              "text": "Sports shoes",
              "done": false
            },
            {
              "text": "Socks",
              "done": false
            },
            {
              "text": "Activewear shirt",
              "done": false
            },
            {
              "text": "Hoodie",
              "done": false
            },
            {
              "text": "Sunglasses",
              "done": false
            }
          ]
        }
      ]
    },
    {
      "areaName": "🧳 Carry-on Packed Bag (Main Luggage)",
      "areaColor": "#2980B9",
      "categories": [
        {
          "title": "Clothes",
          "items": [
            {
              "text": "T-shirts, Tank Tops",
              "done": false
            },
            {
              "text": "Shorts, Skirts",
              "done": false
            },
            {
              "text": "Pants",
              "done": false
            },
            {
              "text": "Layers (hoodie, sweater)",
              "done": false
            },
            {
              "text": "Swim suit",
              "done": false
            },
            {
              "text": "Dress",
              "done": false
            },
            {
              "text": "Socks",
              "done": false
            },
            {
              "text": "Underwear",
              "done": false
            },
            {
              "text": "Bras",
              "done": false
            },
            {
              "text": "Pyjamas, Sleepwear",
              "done": false
            },
            {
              "text": "Formal Wear",
              "done": false
            },
            {
              "text": "Hat",
              "done": false
            },
            {
              "text": "Workout outfit",
              "done": false
            },
            {
              "text": "Other accessories / Earrings",
              "done": false
            }
          ]
        },
        {
          "title": "Shoes & Misc",
          "items": [
            {
              "text": "Dress shoes",
              "done": false
            },
            {
              "text": "Sandals/Crocs",
              "done": false
            },
            {
              "text": "Mobile strap for running",
              "done": false
            },
            {
              "text": "Presents / Card",
              "done": false
            },
            {
              "text": "Reusable tote bag",
              "done": false
            },
            {
              "text": "Pillowcase for used clothes",
              "done": false
            },
            {
              "text": "Micro-fibre Towel",
              "done": false
            },
            {
              "text": "Foldable hangers",
              "done": false
            },
            {
              "text": "Laundry Sheets for washing",
              "done": false
            },
            {
              "text": "Raincoat/Umbrella",
              "done": false
            }
          ]
        },
        {
          "title": "Dry Toiletries",
          "items": [
            {
              "text": "Floss",
              "done": false
            },
            {
              "text": "Toothbrush",
              "done": false
            },
            {
              "text": "Razor (Cartidge), Shaving",
              "done": false
            },
            {
              "text": "Bar of Soap",
              "done": false
            },
            {
              "text": "Cotton pad, q-tips",
              "done": false
            },
            {
              "text": "Nail clippers/tweezers",
              "done": false
            },
            {
              "text": "Personal Hygiene items (Pads)",
              "done": false
            },
            {
              "text": "Makeup",
              "done": false
            },
            {
              "text": "Hair clips, hair ties",
              "done": false
            },
            {
              "text": "Hair Brush/comb",
              "done": false
            },
            {
              "text": "Bandaids, Electrolyte packs",
              "done": false
            },
            {
              "text": "Body wipes",
              "done": false
            },
            {
              "text": "Panadol / Nurofen",
              "done": false
            },
            {
              "text": "Vitamins / Tablets",
              "done": false
            }
          ]
        },
        {
          "title": "💧 1L Clear Bag (Liquids <100ml)",
          "items": [
            {
              "text": "Clear 1 litre bag",
              "done": false
            },
            {
              "text": "Cologne/Perfume",
              "done": false
            },
            {
              "text": "Toothpaste",
              "done": false
            },
            {
              "text": "Face wash",
              "done": false
            },
            {
              "text": "Shampoo & Conditioner",
              "done": false
            },
            {
              "text": "Leave-in conditioner",
              "done": false
            },
            {
              "text": "Micellar Water/Makeup Remover",
              "done": false
            },
            {
              "text": "Sunscreen",
              "done": false
            },
            {
              "text": "Deodorant",
              "done": false
            },
            {
              "text": "Moisturiser",
              "done": false
            }
          ]
        }
      ]
    },
    {
      "areaName": "🎒 Personal Item Bag (Under Seat)",
      "areaColor": "#8E44AD",
      "categories": [
        {
          "title": "Essentials",
          "items": [
            {
              "text": "TRS Claim + Items",
              "done": false
            },
            {
              "text": "Passport + [Copy + Tracker]",
              "done": false
            },
            {
              "text": "Reservations + Itineraries + Insurance",
              "done": false
            },
            {
              "text": "Wallet/Purse + Local cash + Cards",
              "done": false
            },
            {
              "text": "Phone",
              "done": false
            },
            {
              "text": "Crossbody/Sling Bag",
              "done": false
            }
          ]
        },
        {
          "title": "Flight Items",
          "items": [
            {
              "text": "Travel pillow / Foot sling",
              "done": false
            },
            {
              "text": "Phone holder (watch movies)",
              "done": false
            },
            {
              "text": "Compression socks, Slippers",
              "done": false
            },
            {
              "text": "Disposable Toothbrush kit",
              "done": false
            },
            {
              "text": "Eye mask, Eye Drops",
              "done": false
            },
            {
              "text": "Ear plugs, Breath Fresheners",
              "done": false
            },
            {
              "text": "Snacks, TravelCalm",
              "done": false
            },
            {
              "text": "Headphones/Airpods",
              "done": false
            },
            {
              "text": "Airfly/Bluetooth Adapter",
              "done": false
            },
            {
              "text": "Book/Kindle",
              "done": false
            },
            {
              "text": "Water bottle",
              "done": false
            }
          ]
        },
        {
          "title": "Tech",
          "items": [
            {
              "text": "eSIM (Installed)",
              "done": false
            },
            {
              "text": "Mobile downloads (Movies, Shows)",
              "done": false
            },
            {
              "text": "Phone charger",
              "done": false
            },
            {
              "text": "Power cables, Cords",
              "done": false
            },
            {
              "text": "Power Adapter",
              "done": false
            },
            {
              "text": "Power bank",
              "done": false
            },
            {
              "text": "Pen",
              "done": false
            },
            {
              "text": "Laptop",
              "done": false
            },
            {
              "text": "Luggage Trackers",
              "done": false
            }
          ]
        }
      ]
    },
    {
      "areaName": "📝 Trip Notes",
      "areaColor": "#6C5CE7",
      "categories": [
        {
          "title": "Notes",
          "items": [
            {
              "text": "Booking reminders",
              "done": false
            },
            {
              "text": "Places to book",
              "done": false
            },
            {
              "text": "Trip ideas to follow up",
              "done": false
            }
          ]
        }
      ]
    },
    {
      "areaName": "🏨 Hotel Checkout",
      "areaColor": "#1ABC9C",
      "categories": [
        {
          "title": "Room Sweep",
          "items": [
            {
              "text": "Check under the bed",
              "done": false
            },
            {
              "text": "Check the safe",
              "done": false
            },
            {
              "text": "Check all power outlets (chargers)",
              "done": false
            },
            {
              "text": "Check the bathroom (toiletries)",
              "done": false
            },
            {
              "text": "Check drawers and closets",
              "done": false
            }
          ]
        },
        {
          "title": "Checkout",
          "items": [
            {
              "text": "Return room keys",
              "done": false
            },
            {
              "text": "Pay any incidentals/taxes",
              "done": false
            },
            {
              "text": "Get receipt (if needed)",
              "done": false
            }
          ]
        }
      ]
    }
  ],
  "leaveHome": [
    {
      "text": "Kitchen and bins",
      "kind": "section"
    },
    {
      "text": "Empty fridge and pantry perishables",
      "done": false
    },
    {
      "text": "Empty coffee and compost bins and leave outside",
      "done": false
    },
    {
      "text": "Empty bins",
      "done": false,
      "mergeKeys": [
        "take out all rubbish and recycling"
      ]
    },
    {
      "text": "Pause or reschedule any regular deliveries",
      "done": false
    },
    {
      "text": "Check mailbox is empty or hold mail service",
      "done": false
    },
    {
      "text": "Home shutdown",
      "kind": "section"
    },
    {
      "text": "Turn power off everywhere not needed",
      "done": false,
      "mergeKeys": [
        "switch off power points at the wall except fridge"
      ]
    },
    {
      "text": "Check all lights and fans off",
      "done": false
    },
    {
      "text": "Close and check all windows",
      "done": false,
      "mergeKeys": [
        "lock all doors and windows"
      ]
    },
    {
      "text": "Blinds partial down",
      "done": false,
      "mergeKeys": [
        "close blinds or curtains and secure loose outdoor items"
      ]
    },
    {
      "text": "Water off (including outdoor taps)",
      "done": false,
      "mergeKeys": [
        "water off, including outdoor taps",
        "turn off all taps and check for leaks"
      ]
    },
    {
      "text": "Turn off gas supply if applicable",
      "done": false
    },
    {
      "text": "Adjust thermostat to away or saver mode",
      "done": false
    },
    {
      "text": "Security and pets",
      "kind": "section"
    },
    {
      "text": "Check CCTV on",
      "done": false
    },
    {
      "text": "Dog door panel / lock",
      "done": false
    },
    {
      "text": "Automatic fish feeder",
      "done": false,
      "mergeKeys": [
        "automatic fish feeder"
      ]
    },
    {
      "text": "Security system on",
      "done": false,
      "mergeKeys": [
        "set security alarm / notify security company"
      ]
    },
    {
      "text": "Water plants or arrange plant care",
      "done": false
    },
    {
      "text": "Set up lights on timers if away long",
      "done": false
    },
    {
      "text": "Travel ready",
      "kind": "section"
    },
    {
      "text": "Setup international cards on smart devices (Apple Pay / Google Pay)",
      "done": false
    },
    {
      "text": "Setup default transport card on smart devices",
      "done": false
    },
    {
      "text": "Charge all devices including phones, tablets, and power banks",
      "done": false
    },
    {
      "text": "Download offline maps and confirmations",
      "done": false
    },
    {
      "text": "Notify emergency contact of travel plans",
      "done": false
    },
    {
      "text": "Pause gym membership or group activities",
      "done": false
    },
    {
      "text": "If taking dog",
      "kind": "section"
    },
    {
      "text": "Waste bags",
      "done": false,
      "mergeKeys": [
        "if taking dog: waste bags"
      ]
    },
    {
      "text": "Water bowl",
      "done": false,
      "mergeKeys": [
        "if taking dog: water bowl"
      ]
    },
    {
      "text": "Food",
      "done": false,
      "mergeKeys": [
        "if taking dog: food"
      ]
    },
    {
      "text": "Toys",
      "done": false,
      "mergeKeys": [
        "if taking dog: toys"
      ]
    },
    {
      "text": "Leash",
      "done": false,
      "mergeKeys": [
        "if taking dog: leash"
      ]
    },
    {
      "text": "Treats",
      "done": false,
      "mergeKeys": [
        "if taking dog: treats"
      ]
    }
  ],
  "journeys": [
    {
      "id": "journey_default_city-sydney-start_0_0",
      "journeyId": "journey_default_group_city-sydney-start_0_0",
      "journeyName": "Sydney → Tokyo",
      "legId": "city-sydney-start",
      "dayDate": "2026-06-01",
      "fromLocation": "Sydney",
      "toLocation": "Tokyo",
      "fromAddress": "Sydney Kingsford Smith (SYD) - Terminal 1",
      "toAddress": "Tokyo Narita (NRT) - Terminal 2",
      "fromCityId": "city-sydney",
      "toCityId": "city-tokyo",
      "departureDate": "2026-06-01",
      "departureTime": "10:15",
      "arrivalDate": "2026-06-01",
      "arrivalTime": "19:00",
      "transportType": "flight",
      "provider": "Qantas Airways",
      "routeCode": "QF61",
      "status": "booked",
      "cost": "850",
      "bookingReference": "QF88X2",
      "isMultiLeg": false,
      "segmentOrder": 1,
      "notes": "Qantas Flight QF61 | Dep 10:15 | Arr 19:00 | Sydney → Tokyo",
      "legs": [],
      "startDate": "2026-06-01",
      "endDate": "2026-06-01",
      "startTime": "10:15",
      "endTime": "19:00",
      "done": false,
      "_inferredToLegId": "city-tokyo",
      "_inferredFromLegId": "city-sydney-start"
    },
    {
      "id": "journey_default_city-tokyo_5_0",
      "journeyId": "journey_default_group_city-tokyo_5_0",
      "journeyName": "Tokyo → London",
      "legId": "city-tokyo",
      "dayDate": "2026-06-07",
      "fromLocation": "Tokyo",
      "toLocation": "London",
      "fromAddress": "Tokyo Haneda (HND) - Terminal 3",
      "toAddress": "London Heathrow (LHR) - Terminal 5",
      "fromCityId": "city-tokyo",
      "toCityId": "city-london",
      "departureDate": "2026-06-07",
      "departureTime": "09:35",
      "arrivalDate": "2026-06-07",
      "arrivalTime": "16:10",
      "transportType": "flight",
      "provider": "British Airways",
      "routeCode": "BA8",
      "status": "booked",
      "cost": "1100",
      "bookingReference": "BA-TYO-991",
      "isMultiLeg": false,
      "segmentOrder": 1,
      "notes": "British Airways Flight BA8 | Dep 09:35 | Arr 16:10 | Tokyo → London",
      "legs": [],
      "startDate": "2026-06-07",
      "endDate": "2026-06-07",
      "startTime": "09:35",
      "endTime": "16:10",
      "done": false,
      "_inferredToLegId": "city-london",
      "_inferredFromLegId": "city-tokyo"
    },
    {
      "id": "journey_default_city-london_4_0",
      "journeyId": "journey_default_group_city-london_4_0",
      "journeyName": "London → Paris",
      "legId": "city-london",
      "dayDate": "2026-06-11",
      "fromLocation": "London",
      "toLocation": "Paris",
      "fromAddress": "London St Pancras International",
      "toAddress": "Paris Gare du Nord",
      "fromCityId": "city-london",
      "toCityId": "city-paris",
      "departureDate": "2026-06-11",
      "departureTime": "10:30",
      "arrivalDate": "2026-06-11",
      "arrivalTime": "13:47",
      "transportType": "train",
      "provider": "Eurostar",
      "routeCode": "ES9014",
      "status": "booked",
      "cost": "120",
      "bookingReference": "ES-44812",
      "isMultiLeg": false,
      "segmentOrder": 1,
      "notes": "Eurostar Train | Dep 10:30 | Arr 13:47 | London → Paris",
      "legs": [],
      "startDate": "2026-06-11",
      "endDate": "2026-06-11",
      "startTime": "10:30",
      "endTime": "13:47",
      "done": false,
      "_inferredToLegId": "city-paris",
      "_inferredFromLegId": "city-london"
    },
    {
      "id": "journey_default_city-paris_3_0",
      "journeyId": "jid_paris_sydney_return",
      "journeyName": "Paris → Sydney (via Dubai)",
      "legId": "city-paris",
      "dayDate": "2026-06-14",
      "fromLocation": "Paris",
      "toLocation": "Dubai",
      "fromAddress": "Paris Charles de Gaulle (CDG) - Terminal 2C",
      "toAddress": "Dubai International (DXB) - Terminal 3",
      "fromCityId": "city-paris",
      "toCityId": "city-dubai",
      "departureDate": "2026-06-14",
      "departureTime": "21:55",
      "arrivalDate": "2026-06-15",
      "arrivalTime": "06:35",
      "transportType": "flight",
      "provider": "Emirates",
      "routeCode": "EK76",
      "status": "booked",
      "cost": "750",
      "bookingReference": "EK-CDG-7712",
      "isMultiLeg": true,
      "segmentOrder": 1,
      "notes": "Emirates Flight EK76 | Dep 21:55 | Arr +1 06:35 | Paris → Dubai",
      "legs": [],
      "startDate": "2026-06-14",
      "endDate": "2026-06-15",
      "startTime": "21:55",
      "endTime": "06:35",
      "done": false,
      "_inferredToLegId": "city-dubai",
      "_inferredFromLegId": "city-paris"
    },
    {
      "id": "journey_default_city-dubai_2_0",
      "journeyId": "jid_paris_sydney_return",
      "journeyName": "Paris → Sydney (via Dubai)",
      "legId": "city-dubai",
      "dayDate": "2026-06-16",
      "fromLocation": "Dubai",
      "toLocation": "Sydney",
      "fromAddress": "Dubai International (DXB) - Terminal 3",
      "toAddress": "Sydney Kingsford Smith (SYD) - Terminal 1",
      "fromCityId": "city-dubai",
      "toCityId": "city-sydney",
      "departureDate": "2026-06-16",
      "departureTime": "10:15",
      "arrivalDate": "2026-06-17",
      "arrivalTime": "06:00",
      "transportType": "flight",
      "provider": "Emirates",
      "routeCode": "EK412",
      "status": "booked",
      "cost": "750",
      "bookingReference": "EK-DXB-9981",
      "isMultiLeg": true,
      "segmentOrder": 2,
      "notes": "Emirates Flight EK412 | Dep 10:15 | Arr +1 06:00 | Dubai → Sydney",
      "legs": [],
      "startDate": "2026-06-16",
      "endDate": "2026-06-17",
      "startTime": "10:15",
      "endTime": "06:00",
      "done": false,
      "_inferredToLegId": "city-sydney",
      "_inferredFromLegId": "city-dubai"
    }
  ],
  "stays": [
    {
      "id": "stay_default_city-tokyo_0_0",
      "cityId": "city-tokyo",
      "propertyName": "Shinjuku Prince Hotel",
      "checkIn": "2026-06-01",
      "checkOut": "2026-06-07",
      "nights": 6,
      "status": "confirmed",
      "provider": "Booking.com",
      "bookingRef": "BK-TYO-2847",
      "totalCost": "750",
      "notes": "Shinjuku Prince Hotel",
      "checkInTime": "20:00",
      "checkOutTime": "",
      "startDate": "2026-06-01",
      "endDate": "2026-06-07",
      "startTime": "",
      "endTime": "",
      "location": ""
    },
    {
      "id": "stay_default_city-london_0_0",
      "cityId": "city-london",
      "propertyName": "The Hoxton, Shoreditch",
      "checkIn": "2026-06-07",
      "checkOut": "2026-06-11",
      "nights": 4,
      "status": "confirmed",
      "provider": "Hoxton Direct",
      "bookingRef": "HOX-97321",
      "totalCost": "1000",
      "notes": "The Hoxton, Shoreditch",
      "checkInTime": "",
      "checkOutTime": "",
      "startDate": "2026-06-07",
      "endDate": "2026-06-11",
      "startTime": "",
      "endTime": "",
      "location": ""
    },
    {
      "id": "stay_default_city-paris_0_0",
      "cityId": "city-paris",
      "propertyName": "Hotel Le Walt",
      "checkIn": "2026-06-11",
      "checkOut": "2026-06-14",
      "nights": 3,
      "status": "confirmed",
      "provider": "Hotels.com",
      "bookingRef": "HLW-PAR-5512",
      "totalCost": "840",
      "notes": "Hotel Le Walt",
      "checkInTime": "",
      "checkOutTime": "",
      "startDate": "2026-06-11",
      "endDate": "2026-06-14",
      "startTime": "",
      "endTime": "",
      "location": ""
    },
    {
      "id": "stay_default_city-dubai_0_0",
      "cityId": "city-dubai",
      "propertyName": "Dubai Airport Transit Hotel",
      "checkIn": "2026-06-15",
      "checkOut": "2026-06-16",
      "nights": 1,
      "status": "confirmed",
      "provider": "Booking.com",
      "bookingRef": "BK-DXB-0142",
      "totalCost": "150",
      "notes": "Dubai Airport Transit Hotel",
      "checkInTime": "14:00",
      "checkOutTime": "12:00",
      "startDate": "2026-06-15",
      "endDate": "2026-06-16",
      "startTime": "14:00",
      "endTime": "12:00"
    }
  ],
  "cities": [
    {
      "id": "city-sydney",
      "name": "Sydney",
      "lat": -33.8688,
      "lng": 151.2093,
      "colour": "#34495e",
      "code": "SYD",
      "countryCode": "AU",
      "country": "Australia",
      "dateFrom": "",
      "dateTo": ""
    },
    {
      "id": "city-tokyo",
      "name": "Tokyo",
      "lat": 35.6762,
      "lng": 139.6503,
      "colour": "#e74c3c",
      "code": "HND",
      "countryCode": "JP",
      "country": "Japan",
      "dateFrom": "",
      "dateTo": ""
    },
    {
      "id": "city-london",
      "name": "London",
      "lat": 51.5074,
      "lng": -0.1278,
      "colour": "#3498db",
      "code": "LHR",
      "countryCode": "GB",
      "country": "United Kingdom",
      "dateFrom": "",
      "dateTo": ""
    },
    {
      "id": "city-paris",
      "name": "Paris",
      "lat": 48.8566,
      "lng": 2.3522,
      "colour": "#9b59b6",
      "code": "CDG",
      "countryCode": "FR",
      "country": "France",
      "dateFrom": "",
      "dateTo": ""
    },
    {
      "id": "city-dubai",
      "name": "Dubai",
      "lat": 25.2048,
      "lng": 55.2708,
      "colour": "#f1c40f",
      "dateFrom": "",
      "dateTo": ""
    }
  ],
  "userCities": [],
  "userCountries": []
};
