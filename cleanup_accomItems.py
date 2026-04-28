#!/usr/bin/env python3
"""
Clean up old accomItems from itinerary days after converting to stays[].
"""

import json


def cleanup_accomItems(data):
    """Remove accomItems from all days in itinerary."""

    itinerary = data.get('itinerary', [])
    total_cleaned = 0

    for leg in itinerary:
        leg_days = leg.get('days', [])
        for day in leg_days:
            if 'accomItems' in day:
                count = len(day.get('accomItems', []))
                if count > 0:
                    # Keep the field but empty it, or delete it entirely
                    # Option 1: Set to empty array (safer for compatibility)
                    day['accomItems'] = []
                    total_cleaned += count

    print(f"Cleaned {total_cleaned} accomItems from {len(itinerary)} legs")
    return data


def main():
    input_file = 'backups/2026_June_July_Europe_Thailand_converted.json'
    output_file = 'backups/2026_June_July_Europe_Thailand_cleaned.json'

    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("Cleaning up old accomItems...")
    data = cleanup_accomItems(data)

    print(f"Writing {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Done!")
    print(f"\nFile now has {len(data.get('stays', []))} stays")
    print(f"Sample stays:")
    for stay in data['stays'][:3]:
        print(f"  - {stay['propertyName']}: {stay['checkIn']} to {stay['checkOut']}")


if __name__ == '__main__':
    main()
