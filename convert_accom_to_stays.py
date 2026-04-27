#!/usr/bin/env python3
"""
Convert old accomItems in itinerary days to new stays[] format for Travel Planner JSON.
"""

import json
import re
from datetime import datetime


def parse_date(date_str, year=2026):
    """Parse date string like '8 Jun' to YYYY-MM-DD format."""
    if not date_str or date_str == 'TBC':
        return None

    try:
        # Handle format like "8 Jun" or "10 Jun"
        full_date_str = f"{date_str} {year}"
        date_obj = datetime.strptime(full_date_str, "%d %b %Y")
        return date_obj.strftime("%Y-%m-%d")
    except ValueError:
        pass

    # If already in ISO format, return as-is
    if re.match(r"\d{4}-\d{2}-\d{2}", date_str):
        return date_str

    return None


def convert_accom_to_stays(data):
    """Convert old accomItems from itinerary days to new stays[] format."""

    data['stays'] = []

    cities_data = data.get('cities', [])

    # Build city name to ID mapping
    city_name_to_id = {}
    city_id_to_name = {}
    for city in cities_data:
        city_name_to_id[city['name']] = city['id']
        city_id_to_name[city['id']] = city['name']

    # Group consecutive days with same accommodation into stays
    # Process each leg and collect (cityId, property, check_in, check_out, booking_ref, cost)
    stay_segments = []

    itinerary = data.get('itinerary', [])

    for leg in itinerary:
        leg_days = leg.get('days', [])

        current_stay = None

        for day_idx, day in enumerate(leg_days):
            date_str = day.get('date', '')
            accom_items = day.get('accomItems', [])

            # Get the primary accom item
            accom_text = None
            booking_ref = ''
            cost = '0'
            status = 'pending'
            city_id = ''

            for item in accom_items:
                text = item.get('text', '').strip()
                if not text:
                    continue

                # Skip dash-only entries (no accommodation)
                if text == '—':
                    continue

                # Skip transit/no-accommodation entries - but KEEP TBC as it means planned accommodation
                lower_text = text.lower()
                skip_patterns = ['(home!)', '(no hotel)', '(transit', 'home!', 'home)']
                should_skip = any(pattern in lower_text for pattern in skip_patterns)

                # Also skip entries that are explicitly "in transit" or similar
                transit_indicators = ['in transit', 'no hotel', 'between cities', 'transition']
                if any(indicator in lower_text for indicator in transit_indicators):
                    should_skip = True

                if should_skip:
                    continue

                accom_text = text
                cost = item.get('cost', '0')
                status = item.get('status', 'pending')
                booking_ref = item.get('bookingRef', '')
                city_id = item.get('cityId', '')
                break

            if not accom_text:
                # No valid accommodation for this day - close current stay
                if current_stay:
                    stay_segments.append(current_stay)
                    current_stay = None
                continue

            # Extract property name - remove emoji prefixes and normalize
            property_name_raw = re.sub(r'^[🌴🏨🏠✈✓]\s*', '', accom_text).strip()

            if not property_name_raw:
                if current_stay:
                    stay_segments.append(current_stay)
                    current_stay = None
                continue

            # Normalize property name for comparison (lowercase, remove extra spaces)
            property_name = property_name_raw.lower().strip()

            # Determine city for this day
            if not city_id:
                to_city = day.get('to', '')
                if to_city and to_city in city_name_to_id:
                    city_id = city_name_to_id[to_city]
                else:
                    from_city = day.get('from', '')
                    if from_city and from_city in city_name_to_id:
                        city_id = city_name_to_id[from_city]

            check_in_date = parse_date(date_str)
            if not check_in_date:
                continue

            # Check if this continues the current stay
            if current_stay:
                # Property and city must match to extend
                normalized_current = re.sub(r'^[🌴🏨🏠✈✓]\s*', '', current_stay['property']).strip()
                normalized_new = property_name

                if (normalized_current == normalized_new and
                    current_stay['cityId'] == city_id):
                    # Extend the stay
                    current_stay['check_out'] = check_in_date
                    # Add cost if different
                    if cost and cost != '0' and cost != current_stay['cost']:
                        current_stay['cost'] = cost
                    if booking_ref:
                        current_stay['bookingRef'] = booking_ref
                    continue
                else:
                    # New property - close current stay
                    stay_segments.append(current_stay)
                    current_stay = None

            # Start a new stay
            current_stay = {
                'cityId': city_id,
                'property': property_name,
                'check_in': check_in_date,
                'check_out': None,  # Will be set when we find end
                'bookingRef': booking_ref,
                'cost': cost,
                'status': status
            }

        # Don't forget the last stay in this leg
        if current_stay:
            stay_segments.append(current_stay)

    # Merge adjacent segments that are the same property and city
    merged_segments = []
    for segment in stay_segments:
        if merged_segments:
            last = merged_segments[-1]
            if (segment['property'].lower().strip() == last['property'].lower().strip() and
                segment['cityId'] == last['cityId'] and
                last['check_out'] and segment['check_in'] == last['check_out']):
                # Merge into previous
                last['check_out'] = segment['check_out'] if segment['check_out'] else segment['check_in']
                continue
        merged_segments.append(segment)

    # Convert segments to proper stays
    for i, segment in enumerate(merged_segments):
        # If check_out not set, it's a single-night stay
        check_in = segment['check_in']
        check_out = segment['check_out'] if segment['check_out'] else segment['check_in']

        # For checkout, we want the day AFTER the last night
        # If check_out equals check_in → 1 night stay, checkout is next day
        from datetime import timedelta
        try:
            checkout_dt = datetime.strptime(check_out, "%Y-%m-%d")
            # Add one day since check_out stored in loop is the last night, not checkout day
            checkout_dt += timedelta(days=1)
            check_out = checkout_dt.strftime("%Y-%m-%d")
        except:
            pass

        nights = calculate_nights(check_in, check_out)

        stay = {
            'id': f'stay_{i}_{int(datetime.now().timestamp())}',
            'cityId': segment['cityId'],
            'propertyName': segment['property'],
            'checkIn': check_in,
            'checkOut': check_out,
            'nights': nights,
            'status': segment['status'] if segment['status'] in ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled'] else 'pending',
            'provider': '',
            'bookingRef': segment['bookingRef'],
            'totalCost': segment['cost'] if segment['cost'] else '0',
            'notes': ''
        }

        data['stays'].append(stay)

    print(f"Created {len(data['stays'])} stays from old accomItems")
    return data


def calculate_checkout(days, start_idx, accom_text, check_in_date):
    """Calculate checkout date by finding consecutive days with same accommodation."""
    from datetime import timedelta

    # Parse the check-in date
    try:
        check_in = datetime.strptime(check_in_date, "%Y-%m-%d")
    except:
        return None

    consecutive_days = 1
    current_date = check_in

    # Look at subsequent days
    for i in range(start_idx + 1, len(days)):
        day = days[i]
        day_accom = day.get('accom', '')
        day_accom_items = day.get('accomItems', [])

        # Check if any accomItem matches our property
        found_match = False
        for item in day_accom_items:
            item_text = item.get('text', '').strip()
            # Normalize for comparison (remove emojis, etc)
            item_normalized = re.sub(r'^[🌴🏨🏠✈✓]\s*', '', item_text).strip()
            accom_normalized = re.sub(r'^[🌴🏨🏠✈✓]\s*', '', accom_text).strip()

            if item_normalized == accom_normalized and item_normalized:
                found_match = True
                break

        if found_match:
            consecutive_days += 1
            current_date = check_in + timedelta(days=consecutive_days - 1)
        else:
            break

    # Checkout is day after last night
    checkout_date = check_in + timedelta(days=consecutive_days)
    return checkout_date.strftime("%Y-%m-%d")


def calculate_nights(check_in, check_out):
    """Calculate number of nights between check-in and check-out."""
    try:
        check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
        check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
        nights = (check_out_date - check_in_date).days
        return max(1, nights)
    except:
        return 1


def main():
    input_file = 'backups/2026_June_July_Europe_Thailand.json'
    output_file = 'backups/2026_June_July_Europe_Thailand_converted.json'

    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("Converting accomItems to stays...")
    data = convert_accom_to_stays(data)

    print(f"Writing {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Done!")
    print(f"\nTotal stays: {len(data['stays'])}")
    for stay in data['stays'][:5]:
        print(f"  - {stay['propertyName']}: {stay['checkIn']} to {stay['checkOut']} ({stay['nights']} nights)")


if __name__ == '__main__':
    main()
