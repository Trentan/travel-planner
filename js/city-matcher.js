/* ==========================================================================
   MODULE: City Database & Geocoding Matcher (js/city-matcher.js)
   Responsibilities: Static & Extended City DB, ISO Country Data, Fuzzy Levenshtein,
                     Airport Code Resolution (IATA/ICAO), Diacritics Normalization
   ========================================================================== */

// ISO Country codes for travel destinations (Comprehensive Global List)
var COUNTRY_DATA = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
  { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
  { code: 'ZZ', name: 'Other', flag: '🌐' }
];

// Extended city database with IATA codes for Eastern Europe and additional destinations
// Users can still add their own cities via the city dialog
var EXTENDED_CITY_DATABASE = [
{ code: 'BTS', name: 'Bratislava', countryCode: 'SK', timezone: 'Europe/Bratislava', lat: 48.1486, lng: 17.1077 },
{ code: 'SKP', name: 'Skopje', countryCode: 'MK', timezone: 'Europe/Skopje' },
{ code: 'TIA', name: 'Tirana', countryCode: 'AL', timezone: 'Europe/Tirane' },
{ code: 'TGD', name: 'Podgorica', countryCode: 'ME', timezone: 'Europe/Podgorica' },
{ code: 'PRN', name: 'Pristina', countryCode: 'XK', timezone: 'Europe/Pristina' },
{ code: 'SJJ', name: 'Sarajevo', countryCode: 'BA', timezone: 'Europe/Sarajevo' },
{ code: 'SPU', name: 'Split', countryCode: 'HR', timezone: 'Europe/Zagreb', lat: 43.5081, lng: 16.4402 },
{ code: 'DBV', name: 'Dubrovnik', countryCode: 'HR', timezone: 'Europe/Zagreb', lat: 42.6507, lng: 18.0944 },
{ code: 'ZAG', name: 'Zagreb', countryCode: 'HR', timezone: 'Europe/Zagreb', lat: 45.8150, lng: 15.9819 },
{ code: 'LJU', name: 'Ljubljana', countryCode: 'SI', timezone: 'Europe/Ljubljana', lat: 46.0569, lng: 14.5058 },
{ code: 'OTP', name: 'Bucharest', countryCode: 'RO', timezone: 'Europe/Bucharest' },
{ code: 'CLJ', name: 'Cluj-Napoca', countryCode: 'RO', timezone: 'Europe/Bucharest' },
{ code: 'TSR', name: 'Timisoara', countryCode: 'RO', timezone: 'Europe/Bucharest' },
{ code: 'SOF', name: 'Sofia', countryCode: 'BG', timezone: 'Europe/Sofia', lat: 42.6977, lng: 23.3219 },
{ code: 'VAR', name: 'Varna', countryCode: 'BG', timezone: 'Europe/Sofia' },
{ code: 'TLL', name: 'Tallinn', countryCode: 'EE', timezone: 'Europe/Tallinn', lat: 59.4370, lng: 24.7536 },
{ code: 'RIX', name: 'Riga', countryCode: 'LV', timezone: 'Europe/Riga', lat: 56.9496, lng: 24.1052 },
{ code: 'VNO', name: 'Vilnius', countryCode: 'LT', timezone: 'Europe/Vilnius', lat: 54.6872, lng: 25.2797 },
{ code: 'KRK', name: 'Krakow', countryCode: 'PL', timezone: 'Europe/Warsaw', lat: 50.0647, lng: 19.9450 },
{ code: 'POZ', name: 'Poznan', countryCode: 'PL', timezone: 'Europe/Warsaw' },
{ code: 'WAW', name: 'Warsaw', countryCode: 'PL', timezone: 'Europe/Warsaw', lat: 52.2297, lng: 21.0122 },
{ code: 'BEG', name: 'Belgrade', countryCode: 'RS', timezone: 'Europe/Belgrade' },
{ code: 'SKG', name: 'Thessaloniki', countryCode: 'GR', timezone: 'Europe/Athens' },
{ code: 'HER', name: 'Heraklion', countryCode: 'GR', timezone: 'Europe/Athens' },
{ code: 'SIP', name: 'Istanbul Sabiha', countryCode: 'TR', timezone: 'Europe/Istanbul' },
{ code: 'SAW', name: 'Istanbul Sabiha', countryCode: 'TR', timezone: 'Europe/Istanbul' },
{ code: 'IZM', name: 'Izmir', countryCode: 'TR', timezone: 'Europe/Istanbul' },
{ code: 'HTY', name: 'Antalya', countryCode: 'TR', timezone: 'Europe/Istanbul' },
{ code: 'BOJ', name: 'Burgas', countryCode: 'BG', timezone: 'Europe/Sofia' },
{ code: 'TBS', name: 'Tbilisi', countryCode: 'GE', timezone: 'Asia/Tbilisi' },
{ code: 'EVN', name: 'Yerevan', countryCode: 'AM', timezone: 'Asia/Yerevan' },
{ code: 'KIV', name: 'Chisinau', countryCode: 'MD', timezone: 'Europe/Chisinau' },
{ code: 'MOW', name: 'Moscow', countryCode: 'RU', timezone: 'Europe/Moscow' },
{ code: 'LED', name: 'St Petersburg', countryCode: 'RU', timezone: 'Europe/Moscow' },
{ code: 'IEV', name: 'Kyiv', countryCode: 'UA', timezone: 'Europe/Kyiv' },
{ code: 'ODS', name: 'Odessa', countryCode: 'UA', timezone: 'Europe/Kyiv' },
{ code: 'CAI', name: 'Cairo', countryCode: 'EG', timezone: 'Africa/Cairo' },
{ code: 'HRG', name: 'Hurghada', countryCode: 'EG', timezone: 'Africa/Cairo' },
{ code: 'SSH', name: 'Sharm El-Sheikh', countryCode: 'EG', timezone: 'Africa/Cairo' },
{ code: 'AMM', name: 'Amman', countryCode: 'JO', timezone: 'Asia/Amman' },
{ code: 'AQJ', name: 'Aqaba', countryCode: 'JO', timezone: 'Asia/Amman' },
{ code: 'TLV', name: 'Tel Aviv', countryCode: 'IL', timezone: 'Asia/Tel_Aviv' },
{ code: 'BEY', name: 'Beirut', countryCode: 'LB', timezone: 'Asia/Beirut' },
{ code: 'BAH', name: 'Manama', countryCode: 'BH', timezone: 'Asia/Bahrain' },
{ code: 'DOH', name: 'Doha', countryCode: 'QA', timezone: 'Asia/Qatar' },
{ code: 'KWI', name: 'Kuwait City', countryCode: 'KW', timezone: 'Asia/Kuwait' },
{ code: 'MCT', name: 'Muscat', countryCode: 'OM', timezone: 'Asia/Muscat' },
{ code: 'DMM', name: 'Dammam', countryCode: 'SA', timezone: 'Asia/Riyadh' },
{ code: 'JED', name: 'Jeddah', countryCode: 'SA', timezone: 'Asia/Riyadh' },
{ code: 'RUH', name: 'Riyadh', countryCode: 'SA', timezone: 'Asia/Riyadh' },
{ code: 'ALG', name: 'Algiers', countryCode: 'DZ', timezone: 'Africa/Algiers' },
{ code: 'TUN', name: 'Tunis', countryCode: 'TN', timezone: 'Africa/Tunis' },
{ code: 'CMN', name: 'Casablanca', countryCode: 'MA', timezone: 'Africa/Casablanca' },
{ code: 'RAK', name: 'Marrakech', countryCode: 'MA', timezone: 'Africa/Casablanca' },
{ code: 'FIH', name: 'Kinshasa', countryCode: 'CD', timezone: 'Africa/Kinshasa' },
{ code: 'LOS', name: 'Lagos', countryCode: 'NG', timezone: 'Africa/Lagos' },
{ code: 'NBO', name: 'Nairobi', countryCode: 'KE', timezone: 'Africa/Nairobi' },
{ code: 'JNB', name: 'Johannesburg', countryCode: 'ZA', timezone: 'Africa/Johannesburg' },
{ code: 'CPT', name: 'Cape Town', countryCode: 'ZA', timezone: 'Africa/Johannesburg' },
{ code: 'DPS', icaoCode: 'WADD', name: 'Denpasar', countryCode: 'ID', timezone: 'Asia/Makassar', lat: -8.6705, lng: 115.2126 },
{ code: 'CGK', name: 'Jakarta', countryCode: 'ID', timezone: 'Asia/Jakarta', lat: -6.2088, lng: 106.8456 },
{ code: 'SUB', name: 'Surabaya', countryCode: 'ID', timezone: 'Asia/Jakarta', lat: -7.2575, lng: 112.7521 },
{ code: 'RGN', name: 'Yangon', countryCode: 'MM', timezone: 'Asia/Yangon', lat: 16.8661, lng: 96.1951 },
{ code: 'PNH', name: 'Phnom Penh', countryCode: 'KH', timezone: 'Asia/Phnom_Penh', lat: 11.5564, lng: 104.9282 },
{ code: 'REP', name: 'Siem Reap', countryCode: 'KH', timezone: 'Asia/Phnom_Penh', lat: 13.3671, lng: 103.8448 },
{ code: 'VTE', name: 'Vientiane', countryCode: 'LA', timezone: 'Asia/Vientiane' },
{ code: 'LPQ', name: 'Luang Prabang', countryCode: 'LA', timezone: 'Asia/Vientiane', lat: 19.8893, lng: 102.1334 },
{ code: 'HAN', name: 'Hanoi', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh', lat: 21.0285, lng: 105.8542 },
{ code: 'SGN', name: 'Ho Chi Minh City', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh', lat: 10.8231, lng: 106.6297 },
{ code: 'DAD', name: 'Da Nang', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh', lat: 16.0544, lng: 108.2022 },
{ code: 'CXR', name: 'Nha Trang', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
{ code: 'CEB', name: 'Cebu', countryCode: 'PH', timezone: 'Asia/Manila', lat: 10.3157, lng: 123.8854 },
{ code: 'MNL', name: 'Manila', countryCode: 'PH', timezone: 'Asia/Manila', lat: 14.5995, lng: 120.9842 },
{ code: 'DMK', name: 'Bangkok Don Mueang', countryCode: 'TH', timezone: 'Asia/Bangkok' },
{ code: 'CNX', name: 'Chiang Mai', countryCode: 'TH', timezone: 'Asia/Bangkok', lat: 18.7883, lng: 98.9853 },
{ code: 'KBV', name: 'Krabi', countryCode: 'TH', timezone: 'Asia/Bangkok', lat: 8.0863, lng: 98.9063 },
{ code: 'USM', name: 'Koh Samui', countryCode: 'TH', timezone: 'Asia/Bangkok', lat: 9.5120, lng: 100.0136 },
{ code: 'IST', name: 'Istanbul', countryCode: 'TR', timezone: 'Europe/Istanbul' },
{ code: 'TPE', name: 'Taipei', countryCode: 'TW', timezone: 'Asia/Taipei' },
{ code: 'NUE', name: 'Nuremberg', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 49.4521, lng: 11.0767 },
{ code: 'INN', name: 'Innsbruck', countryCode: 'AT', timezone: 'Europe/Vienna', lat: 47.2692, lng: 11.4041 },
{ code: 'BZO', name: 'Bolzano', countryCode: 'IT', timezone: 'Europe/Rome', lat: 46.4983, lng: 11.3548 },
{ code: 'VRN', name: 'Verona', countryCode: 'IT', timezone: 'Europe/Rome', lat: 45.4384, lng: 10.9916 },
];

// Built-in city database with IATA codes
// Built-in city database with IATA & ICAO codes
var CITY_DATABASE = [
  { code: 'ADL', icaoCode: 'YPAD', name: 'Adelaide', countryCode: 'AU', timezone: 'Australia/Adelaide', lat: -34.9285, lng: 138.6007 },
  { code: 'AUH', icaoCode: 'OMAA', name: 'Abu Dhabi', countryCode: 'AE', timezone: 'Asia/Dubai', lat: 24.4539, lng: 54.3773 },
  { code: 'AMS', icaoCode: 'EHAM', name: 'Amsterdam', countryCode: 'NL', timezone: 'Europe/Amsterdam', lat: 52.3676, lng: 4.9041 },
  { code: 'ATH', icaoCode: 'LGAV', name: 'Athens', countryCode: 'GR', timezone: 'Europe/Athens', lat: 37.9838, lng: 23.7275 },
  { code: 'DPS', icaoCode: 'WADD', name: 'Denpasar', countryCode: 'ID', timezone: 'Asia/Makassar', lat: -8.6705, lng: 115.2126 },
  { code: 'BCN', icaoCode: 'LEBL', name: 'Barcelona', countryCode: 'ES', timezone: 'Europe/Madrid', lat: 41.3851, lng: 2.1734 },
  { code: 'BKK', icaoCode: 'VTBS', name: 'Bangkok', countryCode: 'TH', timezone: 'Asia/Bangkok', lat: 13.7563, lng: 100.5018 },
  { code: 'PEK', icaoCode: 'ZBAA', name: 'Beijing', countryCode: 'CN', timezone: 'Asia/Shanghai', lat: 39.9042, lng: 116.4074 },
  { code: 'BNE', icaoCode: 'YBBN', name: 'Brisbane', countryCode: 'AU', timezone: 'Australia/Brisbane', lat: -27.4698, lng: 153.0251 },
  { code: 'BRU', icaoCode: 'EBBR', name: 'Brussels', countryCode: 'BE', timezone: 'Europe/Brussels', lat: 50.8503, lng: 4.3517 },
  { code: 'BUD', icaoCode: 'LHBP', name: 'Budapest', countryCode: 'HU', timezone: 'Europe/Budapest', lat: 47.4979, lng: 19.0402 },
  { code: 'CAI', icaoCode: 'HECA', name: 'Cairo', countryCode: 'EG', timezone: 'Africa/Cairo', lat: 30.0444, lng: 31.2357 },
  { code: 'CAN', icaoCode: 'ZGGG', name: 'Guangzhou', countryCode: 'CN', timezone: 'Asia/Shanghai', lat: 23.1291, lng: 113.2644 },
  { code: 'CDG', icaoCode: 'LFPG', name: 'Paris', countryCode: 'FR', timezone: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
  { code: 'CGN', icaoCode: 'EDDK', name: 'Cologne', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 50.9375, lng: 6.9603 },
  { code: 'CPH', icaoCode: 'EKCH', name: 'Copenhagen', countryCode: 'DK', timezone: 'Europe/Copenhagen', lat: 55.6761, lng: 12.5683 },
  { code: 'DRS', icaoCode: 'EDDC', name: 'Dresden', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 51.0504, lng: 13.7373 },
  { code: 'DUB', icaoCode: 'EIDW', name: 'Dublin', countryCode: 'IE', timezone: 'Europe/Dublin', lat: 53.3498, lng: -6.2603 },
  { code: 'DXB', icaoCode: 'OMDB', name: 'Dubai', countryCode: 'AE', timezone: 'Asia/Dubai', lat: 25.2048, lng: 55.2708 },
  { code: 'DUS', icaoCode: 'EDDL', name: 'Dusseldorf', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 51.2277, lng: 6.7735 },
  { code: 'FCO', icaoCode: 'LIRF', name: 'Rome', countryCode: 'IT', timezone: 'Europe/Rome', lat: 41.9028, lng: 12.4964 },
  { code: 'FLR', icaoCode: 'LIRQ', name: 'Florence', countryCode: 'IT', timezone: 'Europe/Rome', lat: 43.7696, lng: 11.2558 },
  { code: 'FRA', icaoCode: 'EDDF', name: 'Frankfurt', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 50.1109, lng: 8.6821 },
  { code: 'GVA', icaoCode: 'LSGG', name: 'Geneva', countryCode: 'CH', timezone: 'Europe/Zurich', lat: 46.2044, lng: 6.1432 },
  { code: 'HAM', icaoCode: 'EDDH', name: 'Hamburg', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 53.5511, lng: 9.9937 },
  { code: 'HEL', icaoCode: 'EFHK', name: 'Helsinki', countryCode: 'FI', timezone: 'Europe/Helsinki', lat: 60.1695, lng: 24.9354 },
  { code: 'HIJ', icaoCode: 'RJOA', name: 'Hiroshima', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 34.3853, lng: 132.4553 },
  { code: 'HKG', icaoCode: 'VHHH', name: 'Hong Kong', countryCode: 'HK', timezone: 'Asia/Hong_Kong', lat: 22.3193, lng: 114.1694 },
  { code: 'HKT', icaoCode: 'VTSP', name: 'Phuket', countryCode: 'TH', timezone: 'Asia/Bangkok', lat: 7.8804, lng: 98.3923 },
  { code: 'HND', icaoCode: 'RJTT', name: 'Tokyo', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
  { code: 'IST', icaoCode: 'LTFM', name: 'Istanbul', countryCode: 'TR', timezone: 'Europe/Istanbul', lat: 41.0082, lng: 28.9784 },
  { code: 'JFK', icaoCode: 'KJFK', name: 'New York', countryCode: 'US', timezone: 'America/New_York', lat: 40.7128, lng: -74.0060 },
  { code: 'KIX', icaoCode: 'RJBB', name: 'Osaka', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 34.6937, lng: 135.5023 },
  { code: 'KUL', icaoCode: 'WMKK', name: 'Kuala Lumpur', countryCode: 'MY', timezone: 'Asia/Kuala_Lumpur', lat: 3.1390, lng: 101.6869 },
  { code: 'LAS', icaoCode: 'KLAS', name: 'Las Vegas', countryCode: 'US', timezone: 'America/Los_Angeles', lat: 36.1716, lng: -115.1391 },
  { code: 'LAX', icaoCode: 'KLAX', name: 'Los Angeles', countryCode: 'US', timezone: 'America/Los_Angeles', lat: 34.0522, lng: -118.2437 },
  { code: 'LHR', icaoCode: 'EGLL', name: 'London', countryCode: 'GB', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { code: 'LIS', icaoCode: 'LPPT', name: 'Lisbon', countryCode: 'PT', timezone: 'Europe/Lisbon', lat: 38.7223, lng: -9.1393 },
  { code: 'MAD', icaoCode: 'LEMD', name: 'Madrid', countryCode: 'ES', timezone: 'Europe/Madrid', lat: 40.4168, lng: -3.7038 },
  { code: 'MAN', icaoCode: 'EGCC', name: 'Manchester', countryCode: 'GB', timezone: 'Europe/London', lat: 53.4808, lng: -2.2426 },
  { code: 'MEL', icaoCode: 'YMML', name: 'Melbourne', countryCode: 'AU', timezone: 'Australia/Melbourne', lat: -37.8136, lng: 144.9631 },
  { code: 'MEX', icaoCode: 'MMMX', name: 'Mexico City', countryCode: 'MX', timezone: 'America/Mexico_City', lat: 19.4326, lng: -99.1332 },
  { code: 'MIL', icaoCode: 'LIMC', name: 'Milan', countryCode: 'IT', timezone: 'Europe/Rome', lat: 45.4642, lng: 9.1900 },
  { code: 'MUC', icaoCode: 'EDDM', name: 'Munich', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 48.1351, lng: 11.5820 },
  { code: 'NCE', icaoCode: 'LFMN', name: 'Nice', countryCode: 'FR', timezone: 'Europe/Paris', lat: 43.7102, lng: 7.2620 },
  { code: 'NRT', icaoCode: 'RJAA', name: 'Tokyo', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 35.7767, lng: 140.3183 },
  { code: 'NRA', icaoCode: 'RJRO', name: 'Nara', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 34.6851, lng: 135.8048 },
  { code: 'UKY', icaoCode: 'RJBB', name: 'Kyoto', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 35.0116, lng: 135.7681 },
  { code: 'UKB', icaoCode: 'RJBE', name: 'Kobe', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 34.6901, lng: 135.1955 },
  { code: 'NGO', icaoCode: 'RJGG', name: 'Nagoya', countryCode: 'JP', timezone: 'Asia/Tokyo', lat: 35.1815, lng: 136.9066 },
  { code: 'OSL', icaoCode: 'ENGM', name: 'Oslo', countryCode: 'NO', timezone: 'Europe/Oslo', lat: 59.9139, lng: 10.7522 },
  { code: 'PER', icaoCode: 'YPPH', name: 'Perth', countryCode: 'AU', timezone: 'Australia/Perth', lat: -31.9505, lng: 115.8605 },
  { code: 'PRG', icaoCode: 'LKPR', name: 'Prague', countryCode: 'CZ', timezone: 'Europe/Prague', lat: 50.0755, lng: 14.4378 },
  { code: 'PVG', icaoCode: 'ZSPD', name: 'Shanghai', countryCode: 'CN', timezone: 'Asia/Shanghai', lat: 31.2304, lng: 121.4737 },
  { code: 'REK', icaoCode: 'BIRK', name: 'Reykjavik', countryCode: 'IS', timezone: 'Atlantic/Reykjavik', lat: 64.1265, lng: -21.8174 },
  { code: 'RIO', icaoCode: 'SBGL', name: 'Rio de Janeiro', countryCode: 'BR', timezone: 'America/Sao_Paulo', lat: -22.9068, lng: -43.1729 },
  { code: 'SFO', icaoCode: 'KSFO', name: 'San Francisco', countryCode: 'US', timezone: 'America/Los_Angeles', lat: 37.7749, lng: -122.4194 },
  { code: 'SIN', icaoCode: 'WSSS', name: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
  { code: 'STO', icaoCode: 'ESSB', name: 'Stockholm', countryCode: 'SE', timezone: 'Europe/Stockholm', lat: 59.3293, lng: 18.0686 },
  { code: 'STR', icaoCode: 'EDDS', name: 'Stuttgart', countryCode: 'DE', timezone: 'Europe/Berlin', lat: 48.7758, lng: 9.1829 },
  { code: 'SYD', icaoCode: 'YSSY', name: 'Sydney', countryCode: 'AU', timezone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
  { code: 'TPE', icaoCode: 'RCTP', name: 'Taipei', countryCode: 'TW', timezone: 'Asia/Taipei', lat: 25.0330, lng: 121.5654 },
  { code: 'VCE', icaoCode: 'LIPZ', name: 'Venice', countryCode: 'IT', timezone: 'Europe/Rome', lat: 45.4408, lng: 12.3155 },
  { code: 'VIE', icaoCode: 'LOWW', name: 'Vienna', countryCode: 'AT', timezone: 'Europe/Vienna', lat: 48.2082, lng: 16.3738 },
  { code: 'YVR', icaoCode: 'CYVR', name: 'Vancouver', countryCode: 'CA', timezone: 'America/Vancouver', lat: 49.2827, lng: -123.1207 },
  { code: 'ZRH', icaoCode: 'LSZH', name: 'Zurich', countryCode: 'CH', timezone: 'Europe/Zurich', lat: 47.3769, lng: 8.5417 }
];

// Combine all city databases for lookups (built-in + extended + user-extensible)
var ALL_CITIES = [...CITY_DATABASE, ...EXTENDED_CITY_DATABASE];

// Precomputed fast lookup maps and sets for static ALL_CITIES
var ALL_CITIES_BY_NAME_MAP = new Map();
var ALL_CITIES_BY_NAME_COUNTRY_MAP = new Map();
var ALL_CITIES_BY_CODE_MAP = new Map();
var ALL_CITIES_BY_CITY_ID_MAP = new Map();
var ALL_CITIES_BY_CLEAN_NAME_MAP = new Map();
var ALL_CITIES_HAS_COORDS_SET = new Set();
if (typeof window !== 'undefined') window.ALL_CITIES_BY_NAME_MAP = ALL_CITIES_BY_NAME_MAP;
if (typeof window !== 'undefined') window.ALL_CITIES_BY_NAME_COUNTRY_MAP = ALL_CITIES_BY_NAME_COUNTRY_MAP;
if (typeof global !== 'undefined') global.ALL_CITIES_BY_NAME_COUNTRY_MAP = ALL_CITIES_BY_NAME_COUNTRY_MAP;
if (typeof global !== 'undefined') global.ALL_CITIES_BY_NAME_MAP = ALL_CITIES_BY_NAME_MAP;

ALL_CITIES.forEach(c => {
  if (c && c.name) {
    const lowerName = c.name.toLowerCase();
    if (!ALL_CITIES_BY_NAME_MAP.has(lowerName)) {
      ALL_CITIES_BY_NAME_MAP.set(lowerName, []);
    }
    ALL_CITIES_BY_NAME_MAP.get(lowerName).push(c);

    const cityId = 'city-' + lowerName.replace(/[^a-z0-9]/g, '-');
    if (!ALL_CITIES_BY_CITY_ID_MAP.has(cityId)) {
      ALL_CITIES_BY_CITY_ID_MAP.set(cityId, c);
    }

    const cleanName = lowerName.replace(/-/g, '');
    if (!ALL_CITIES_BY_CLEAN_NAME_MAP.has(cleanName)) {
      ALL_CITIES_BY_CLEAN_NAME_MAP.set(cleanName, c);
    }

    if (c.countryCode) {
      const key = `${lowerName}|${c.countryCode.toUpperCase()}`;
      if (!ALL_CITIES_BY_NAME_COUNTRY_MAP.has(key)) {
        ALL_CITIES_BY_NAME_COUNTRY_MAP.set(key, c);
      }
    }

    if (c.lat !== undefined && c.lng !== undefined) {
      ALL_CITIES_HAS_COORDS_SET.add(lowerName);
    }
  }
  if (c && c.code) {
    const upperCode = c.code.toUpperCase();
    if (!ALL_CITIES_BY_CODE_MAP.has(upperCode)) {
      ALL_CITIES_BY_CODE_MAP.set(upperCode, c);
    }
  }
});

// User-extensible cities (persisted to localStorage)
var userCities = []; // { code, name, countryCode }
function getUserCities() { return userCities; }
if (typeof window !== 'undefined') {
  window.getUserCities = getUserCities;
  window.userCities = userCities;
}

// User-extensible countries (persisted to localStorage)
var userCountries = []; // { code, name, flag }


async function searchCityOnline(cityName, countryCode = '', countryName = '') {
  if (!cityName) return null;
  const cleanName = cityName.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').trim();
  
  const searchQ = (countryName && countryName !== 'Other') ? `${cleanName}, ${countryName}` : cleanName;
  const countryParam = countryCode ? `&countrycodes=${encodeURIComponent(countryCode.toLowerCase())}` : '';

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQ)}${countryParam}&addressdetails=1&limit=5`, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      let best = data[0];
      if (countryCode) {
        const cMatch = data.find(d => (d.address?.country_code || '').toUpperCase() === countryCode.toUpperCase());
        if (cMatch) best = cMatch;
      }
      return {
        lat: parseFloat(best.lat),
        lng: parseFloat(best.lon),
        countryCode: (best.address?.country_code || '').toUpperCase(),
        countryName: best.address?.country || '',
        displayName: best.display_name
      };
    }
  } catch (e) {
    console.error('[Geocoding] Online search failed:', e);
  }
  return null;
}

window.searchCityOnline = searchCityOnline;

function cityHasStoredCoords(city) {
  if (!city) return false;
  if (city.lat === null || city.lat === undefined || city.lng === null || city.lng === undefined) return false;
  const lat = Number.parseFloat(city.lat);
  const lng = Number.parseFloat(city.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
}

// Multilingual and alternative city aliases dictionary (normalized lower-case keys)
var CITY_ALIASES = {
  // German / Central Europe
  'muenchen': 'Munich',
  'münchen': 'Munich',
  'munchen': 'Munich',
  'wien': 'Vienna',
  'praha': 'Prague',
  'warszawa': 'Warsaw',
  'krakow': 'Krakow',
  'kraków': 'Krakow',
  'cracow': 'Krakow',
  'budapest': 'Budapest',
  'koln': 'Cologne',
  'köln': 'Cologne',
  'cologne': 'Cologne',
  'zurich': 'Zurich',
  'zürich': 'Zurich',
  'geneve': 'Geneva',
  'genève': 'Geneva',
  'genf': 'Geneva',
  'basel': 'Basel',
  'bâle': 'Basel',

  // Italy
  'roma': 'Rome',
  'firenze': 'Florence',
  'florenz': 'Florence',
  'venezia': 'Venice',
  'venise': 'Venice',
  'venedig': 'Venice',
  'milano': 'Milan',
  'mailand': 'Milan',
  'napoli': 'Naples',
  'neapel': 'Naples',
  'torino': 'Turin',
  'genova': 'Genoa',

  // Spain & Portugal
  'sevilla': 'Seville',
  'lisboa': 'Lisbon',
  'lissabon': 'Lisbon',
  'porto': 'Porto',
  'oporto': 'Porto',
  'valencia': 'Valencia',
  'valència': 'Valencia',

  // France & Belgium
  'bruxelles': 'Brussels',
  'brussel': 'Brussels',
  'anvers': 'Antwerp',
  'antwerpen': 'Antwerp',

  // Asia & Oceania
  'peking': 'Beijing',
  'beijing': 'Beijing',
  'canton': 'Guangzhou',
  'guangzhou': 'Guangzhou',
  'saigon': 'Ho Chi Minh City',
  'ho chi minh': 'Ho Chi Minh City',
  'ho chi minh city': 'Ho Chi Minh City',
  'hcmc': 'Ho Chi Minh City',
  'bombay': 'Mumbai',
  'mumbai': 'Mumbai',
  'calcutta': 'Kolkata',
  'kolkata': 'Kolkata',
  'madras': 'Chennai',
  'chennai': 'Chennai',
  'tokio': 'Tokyo',
  'krung thep': 'Bangkok',
  'bali': 'Denpasar',
  'denpasar': 'Denpasar',
  'denpasar bali': 'Denpasar',
  'dps': 'Denpasar',
  'seminyak': 'Denpasar',
  'canggu': 'Denpasar',
  'ubud': 'Denpasar',
  'kuta': 'Denpasar',
  'sanur': 'Denpasar',
  'uluwatu': 'Denpasar',
  'nusa dua': 'Denpasar',

  // Middle East
  'dubayy': 'Dubai',
  'dxb': 'Dubai',
  'abu dhabi': 'Abu Dhabi',
  'abudhabi': 'Abu Dhabi',
  'auh': 'Abu Dhabi',

  // Americas & Eastern Europe
  'new york city': 'New York',
  'nyc': 'New York',
  'sf': 'San Francisco',
  'la': 'Los Angeles',
  'montreal': 'Montreal',
  'montréal': 'Montreal',
  'sao paulo': 'Sao Paulo',
  'são paulo': 'Sao Paulo',
  'ciudad de mexico': 'Mexico City',
  'cdmx': 'Mexico City',
  'kyiv': 'Kyiv',
  'kiev': 'Kyiv'
};

function stripDiacritics(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function calculateLevenshteinDistance(a, b) {
  const str1 = String(a || '');
  const str2 = String(b || '');
  if (str1 === str2) return 0;
  if (!str1) return str2.length;
  if (!str2) return str1.length;

  const aLen = str1.length;
  const bLen = str2.length;

  const str1Codes = new Int32Array(aLen);
  for (let j = 0; j < aLen; j++) {
    str1Codes[j] = str1.charCodeAt(j);
  }

  let prev = new Int32Array(aLen + 1);
  let curr = new Int32Array(aLen + 1);

  for (let j = 0; j <= aLen; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    const char2 = str2.charCodeAt(i - 1);
    curr[0] = i;
    for (let j = 1; j <= aLen; j++) {
      if (char2 === str1Codes[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        const sub = prev[j - 1];
        const ins = curr[j - 1];
        const del = prev[j];
        let min = sub < ins ? sub : ins;
        if (del < min) min = del;
        curr[j] = min + 1;
      }
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }
  return prev[aLen];
}

function calculateSimilarityScore(str1, str2) {
  const s1 = stripDiacritics(String(str1 || '').trim().toLowerCase());
  const s2 = stripDiacritics(String(str2 || '').trim().toLowerCase());
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = calculateLevenshteinDistance(s1, s2);
  return Math.max(0, 1 - (dist / maxLen));
}

function getCityAliasMatch(cityName) {
  if (!cityName) return null;
  const norm = String(cityName).trim().toLowerCase();
  const stripped = stripDiacritics(norm);
  const targetName = CITY_ALIASES[norm] || CITY_ALIASES[stripped];
  if (!targetName) return null;
  const db = (typeof ALL_CITIES !== 'undefined' && Array.isArray(ALL_CITIES)) ? ALL_CITIES : [];
  return db.find(c => c.name.toLowerCase() === targetName.toLowerCase()) || null;
}

function findFuzzyCityCandidate(input, options = {}) {
  const cleanInput = String(input || '')
    .replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '')
    .trim();
  if (!cleanInput || cleanInput.length < 3) return null;

  const normInput = cleanInput.toLowerCase();
  // 'Home' is a system anchor, never fuzzy-match it to a real city (like Rome)
  if (normInput === 'home') return null;

  const strippedInput = stripDiacritics(normInput);
  const targetCountryCode = options.countryCode ? String(options.countryCode).toUpperCase() : '';

  // Check alias dictionary first
  const aliasCandidate = getCityAliasMatch(cleanInput);
  if (aliasCandidate) {
    if (!targetCountryCode || aliasCandidate.countryCode === targetCountryCode) {
      return {
        candidate: aliasCandidate,
        score: 0.98,
        distance: 0,
        type: 'alias'
      };
    }
  }

  const db = (typeof ALL_CITIES !== 'undefined' && Array.isArray(ALL_CITIES)) ? ALL_CITIES : [];
  let best = null;

  for (const candidate of db) {
    if (!candidate || !candidate.name) continue;
    const candNameLower = candidate.name.toLowerCase();
    const candNameStripped = stripDiacritics(candNameLower);

    // Exact match (including diacritics stripped)
    if (candNameLower === normInput || candNameStripped === strippedInput) {
      const isCountryMatch = targetCountryCode && candidate.countryCode === targetCountryCode;
      return {
        candidate,
        score: isCountryMatch ? 1.0 : 0.99,
        distance: 0,
        type: 'exact'
      };
    }

    const dist = calculateLevenshteinDistance(strippedInput, candNameStripped);
    const maxLen = Math.max(strippedInput.length, candNameStripped.length);
    let score = 1 - (dist / maxLen);

    // Give bonus for matching country
    if (targetCountryCode && candidate.countryCode === targetCountryCode) {
      score += 0.05;
    }

    // Distance threshold: short names (<=4 chars) max dist 1, longer max dist 2 or 3
    const maxAllowedDist = maxLen <= 4 ? 1 : (maxLen <= 8 ? 2 : 3);
    if (dist <= maxAllowedDist && score >= 0.72) {
      if (!best || score > best.score || (score === best.score && dist < best.distance)) {
        best = {
          candidate,
          score,
          distance: dist,
          type: 'fuzzy'
        };
      }
    }
  }

  return best;
}

function getCityLocationDatabaseMatch(city) {
  if (!city) return null;
  const cityName = String(city.name || '').trim().toLowerCase();
  const cityCode = String(city.code || '').trim().toUpperCase();
  const targetCountryCode = String(city.countryCode || '').trim().toUpperCase();

  // 1. Exact match with target country code
  if (cityName && targetCountryCode) {
    const match = ALL_CITIES_BY_NAME_COUNTRY_MAP.get(`${cityName}|${targetCountryCode}`);
    if (match) return match;
  }

  // 2. Exact match by name or airport code
  if (cityName) {
    const matches = ALL_CITIES_BY_NAME_MAP.get(cityName);
    if (matches && matches.length > 0) return matches[0];
  }
  if (cityCode) {
    const match = ALL_CITIES_BY_CODE_MAP.get(cityCode);
    if (match) return match;
  }

  // 3. Multilingual / alternate alias match
  const aliasMatch = getCityAliasMatch(cityName);
  if (aliasMatch) {
    if (!targetCountryCode || aliasMatch.countryCode === targetCountryCode) {
      return aliasMatch;
    }
  }

  // 4. Fuzzy Levenshtein match (typo tolerance)
  if (cityName && cityName.length >= 3) {
    const fuzzy = findFuzzyCityCandidate(cityName, { countryCode: targetCountryCode });
    if (fuzzy && fuzzy.score >= 0.75) {
      return fuzzy.candidate;
    }
  }

  return null;
}

function normalizeCityLocationData(city) {
  if (!city || typeof city !== 'object') return city;

  const cityName = String(city.name || '').trim();
  const dbMatch = getCityLocationDatabaseMatch(city);

  if (cityName) {
    if (!city.name) {
      city.name = dbMatch ? dbMatch.name : formatCityTitleCase(cityName);
    } else if (dbMatch && dbMatch.name && dbMatch.name.toLowerCase() === cityName.toLowerCase()) {
      city.name = dbMatch.name;
    } else {
      city.name = formatCityTitleCase(cityName);
    }
  }

  if (!city.id && cityName) {
    city.id = 'city-' + city.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  if (city.code && String(city.code).trim().length === 2 && !city.countryCode) {
    city.countryCode = String(city.code).trim().toUpperCase();
    delete city.code;
  }

  if (dbMatch) {
    if (!city.code && dbMatch.code) city.code = dbMatch.code;
    if (!city.icaoCode && (dbMatch.icaoCode || dbMatch.icao)) city.icaoCode = dbMatch.icaoCode || dbMatch.icao;
    if (!city.countryCode && dbMatch.countryCode) city.countryCode = dbMatch.countryCode;
    if (!city.country && dbMatch.countryCode) city.country = getCountryName(dbMatch.countryCode);
    if (!city.timezone && (dbMatch.timezone || (typeof getCityTimezone === 'function' && getCityTimezone(city.name)))) {
      city.timezone = dbMatch.timezone || getCityTimezone(city.name);
    }
    if (!cityHasStoredCoords(city) && dbMatch.lat !== undefined && dbMatch.lng !== undefined) {
      city.lat = dbMatch.lat;
      city.lng = dbMatch.lng;
    }
  } else if (city.countryCode && !city.country) {
    city.country = getCountryName(city.countryCode);
  }

  if (!city.code && typeof getCityIataCode === 'function') {
    const iata = getCityIataCode(cityName || city.name);
    if (iata) city.code = iata;
  }
  if (!city.icaoCode && typeof getCityIcaoCode === 'function') {
    const icao = getCityIcaoCode(cityName || city.name);
    if (icao) city.icaoCode = icao;
  }

  if (!city.timezone && typeof getCityTimezone === 'function' && cityName) {
    city.timezone = getCityTimezone(cityName);
  }

  if (city.lat !== undefined && city.lat !== null && city.lat !== '') {
    const lat = Number.parseFloat(city.lat);
    if (Number.isFinite(lat)) city.lat = lat;
  }
  if (city.lng !== undefined && city.lng !== null && city.lng !== '') {
    const lng = Number.parseFloat(city.lng);
    if (Number.isFinite(lng)) city.lng = lng;
  }

  return city;
}

function resolveCityLocationLocal(city) {
  if (!city || !city.name) return null;
  if (String(city.name).trim().toLowerCase() === 'home') return null;

  let dbMatch = null;
  const targetCountryCode = (city.countryCode || '').toUpperCase();
  const targetCountryName = (city.country || '').toLowerCase();
  const cityNameLower = city.name.toLowerCase();

  if (targetCountryCode) {
    dbMatch = ALL_CITIES_BY_NAME_COUNTRY_MAP.get(`${cityNameLower}|${targetCountryCode}`) || null;
  }
  if (!dbMatch && targetCountryName) {
    const candidates = ALL_CITIES_BY_NAME_MAP.get(cityNameLower);
    if (candidates) {
      dbMatch = candidates.find(c => c.countryCode && getCountryName(c.countryCode).toLowerCase() === targetCountryName) || null;
    }
  }
  if (!dbMatch) {
    const candidates = ALL_CITIES_BY_NAME_MAP.get(cityNameLower);
    if (candidates && candidates.length > 0) {
      dbMatch = candidates[0];
    }
  }
  if (!dbMatch) {
    dbMatch = getCityLocationDatabaseMatch(city);
  }

  if (dbMatch && dbMatch.lat !== undefined && dbMatch.lng !== undefined) {
    return {
      lat: dbMatch.lat,
      lng: dbMatch.lng,
      countryCode: dbMatch.countryCode || '',
      code: dbMatch.code || '',
      icaoCode: dbMatch.icaoCode || dbMatch.icao || ''
    };
  }

  return null;
}

async function resolveCityLocation(city) {
  if (!city || !city.name) return null;

  const localMatch = resolveCityLocationLocal(city);
  if (localMatch) return localMatch;

  const onlineMatch = await searchCityOnline(city.name, city.countryCode || '', city.country || '');
  if (!onlineMatch) return null;

  return {
    lat: onlineMatch.lat,
    lng: onlineMatch.lng,
    countryCode: onlineMatch.countryCode || city.countryCode || '',
    countryName: onlineMatch.countryName || city.country || '',
    code: '',
    icaoCode: ''
  };
}

function applyCityLocation(city, location) {
  if (!city || !location) return false;

  city.lat = location.lat;
  city.lng = location.lng;
  if (location.countryCode) {
    city.countryCode = location.countryCode;
    const mappedName = getCountryName(location.countryCode);
    city.country = (mappedName && mappedName !== location.countryCode)
      ? mappedName
      : (location.countryName || mappedName);
  } else if (location.countryName && !city.country) {
    city.country = location.countryName;
  }
  if (location.code && !city.code) city.code = location.code;
  if (location.icaoCode) city.icaoCode = location.icaoCode;

  if (!city.icaoCode || !city.code) {
    const cityNameLower = city.name.toLowerCase();
    let dbMatch = null;
    if (city.countryCode) {
      dbMatch = ALL_CITIES_BY_NAME_COUNTRY_MAP.get(`${cityNameLower}|${city.countryCode.toUpperCase()}`);
    }
    if (!dbMatch) {
      const candidates = ALL_CITIES_BY_NAME_MAP.get(cityNameLower);
      if (candidates && candidates.length > 0) dbMatch = candidates[0];
    }

    if (dbMatch) {
      if (!city.code && dbMatch.code) city.code = dbMatch.code;
      if (!city.icaoCode && (dbMatch.icaoCode || dbMatch.icao)) city.icaoCode = dbMatch.icaoCode || dbMatch.icao;
    }
  }

  return true;
}

async function searchCityOnlineCandidates(cityName) {
  if (!cityName) return [];
  const cleanName = cityName.replace(/^[📍🗺️✈️🏨🏠🇯🇵🇫🇷🇮🇹🇬🇧🇺🇸🇦🇺]+\s*/, '').trim();

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanName)}&addressdetails=1&limit=5`, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map(item => {
      const countryCode = (item.address?.country_code || '').toUpperCase();
      const rawName = item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || item.address?.island || item.name || cleanName;
      const region = item.address?.state || item.address?.county || item.address?.island || item.address?.province || '';
      return {
        name: rawName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        countryCode: countryCode,
        countryName: item.address?.country || getCountryName(countryCode) || countryCode,
        region: region,
        displayName: item.display_name
      };
    });
  } catch (e) {
    console.warn(`[Online Search] Candidates fetch failed for ${cleanName}:`, e);
    return [];
  }
}


// Format city name to proper title case (e.g. osaka -> Osaka, NEW YORK -> New York)
function formatCityTitleCase(str) {
  if (!str || typeof str !== 'string') return str || '';
  const clean = str.trim();
  if (!clean) return '';
  
  const minorWords = new Set(['and', 'of', 'on', 'in', 'at', 'by', 'for', 'the', 'de', 'la', 'del', 'da', 'do', 'des']);
  return clean
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return word;
      const lower = word.toLowerCase();
      if (index > 0 && minorWords.has(lower)) {
        return lower;
      }
      return word.split('-').map(sub => {
        if (!sub) return sub;
        return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
      }).join('-');
    })
    .join(' ');
}

// Get country name by code
function getCountryName(countryCode) {
  if (!countryCode) return '';
  // First check built-in countries
  const country = COUNTRY_DATA.find(c => c.code === countryCode.toUpperCase());
  if (country) return country.name;
  // Then check user countries
  const userCountry = userCountries.find(c => c.code === countryCode.toUpperCase());
  if (userCountry) return userCountry.name;
  return countryCode;
}

// Get country flag by code
function getCountryFlag(countryCode) {
  if (!countryCode) return '';
  const code = String(countryCode).trim().toUpperCase();
  // First check built-in countries
  if (typeof COUNTRY_DATA !== 'undefined' && Array.isArray(COUNTRY_DATA)) {
    const country = COUNTRY_DATA.find(c => c && c.code === code);
    if (country && country.flag) return country.flag;
  }
  // Then check user countries
  if (typeof userCountries !== 'undefined' && Array.isArray(userCountries)) {
    const userCountry = userCountries.find(c => c && c.code === code);
    if (userCountry && userCountry.flag) return userCountry.flag;
  }
  // If valid 2-letter ISO code, dynamically produce Unicode regional indicator flag
  if (code.length === 2 && /^[A-Z]{2}$/.test(code)) {
    const emoji = typeof getCountryFlagEmoji === 'function' ? getCountryFlagEmoji(code) : '';
    if (emoji) return emoji;
  }
  return '🌐';
}

// Get all countries (built-in + user countries)
function getAllCountries() {
  // Filter out "Other" from built-in countries since we're adding custom ones
  const builtinCountries = COUNTRY_DATA.filter(c => c.code !== 'ZZ');
  return [...builtinCountries, ...userCountries];
}

function addUserCity(cityCode, cityName, countryCode, lat = undefined, lng = undefined) {
  if (!cityName) return null;
  const nameTrimmed = cityName.trim();
  const cCode = (cityCode || 'city-' + nameTrimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')).toUpperCase();
  const cCountry = (countryCode || '').toUpperCase();

  // Check for duplicate code or name
  let existing = userCities.find(c =>
    (c.code && c.code.toUpperCase() === cCode) ||
    c.name.toLowerCase() === nameTrimmed.toLowerCase()
  );
  if (existing) {
    if (lat !== undefined && lat !== null && !isNaN(Number(lat))) existing.lat = Number(lat);
    if (lng !== undefined && lng !== null && !isNaN(Number(lng))) existing.lng = Number(lng);
    if (cCountry && !existing.countryCode) existing.countryCode = cCountry;
    localStorage.setItem('travelApp_userCities_v1', JSON.stringify(userCities));
    if (typeof window !== 'undefined' && window.__dynamicCityCoordsCache && cityHasStoredCoords(existing)) {
      window.__dynamicCityCoordsCache.set(nameTrimmed.toLowerCase(), { lat: Number(existing.lat), lng: Number(existing.lng) });
    }
    return existing;
  }

  const newCity = {
    code: cCode,
    name: nameTrimmed,
    countryCode: cCountry
  };
  if (lat !== undefined && lat !== null && !isNaN(Number(lat))) newCity.lat = Number(lat);
  if (lng !== undefined && lng !== null && !isNaN(Number(lng))) newCity.lng = Number(lng);

  userCities.push(newCity);
  localStorage.setItem('travelApp_userCities_v1', JSON.stringify(userCities));

  if (typeof window !== 'undefined') {
    window.__dynamicCityCoordsCache = window.__dynamicCityCoordsCache || new Map();
    if (cityHasStoredCoords(newCity)) {
      window.__dynamicCityCoordsCache.set(nameTrimmed.toLowerCase(), { lat: Number(newCity.lat), lng: Number(newCity.lng) });
    }
  }

  // Index into fast lookup maps
  const lowerName = nameTrimmed.toLowerCase();
  if (typeof ALL_CITIES_BY_NAME_MAP !== 'undefined') {
    if (!ALL_CITIES_BY_NAME_MAP.has(lowerName)) {
      ALL_CITIES_BY_NAME_MAP.set(lowerName, []);
    }
    ALL_CITIES_BY_NAME_MAP.get(lowerName).push(newCity);
  }
  if (typeof ALL_CITIES_BY_NAME_COUNTRY_MAP !== 'undefined' && newCity.countryCode) {
    ALL_CITIES_BY_NAME_COUNTRY_MAP.set(`${lowerName}|${newCity.countryCode}`, newCity);
  }

  // Refresh datalists
  if (typeof createCityDatalists === 'function') {
    createCityDatalists();
  }

  return newCity;
}

// Add a user-defined country
function addUserCountry(countryCode, countryName, flag = '🌐') {
  if (!countryCode || !countryName) return null;

  // Generate a short code if none provided
  let code = countryCode.toUpperCase();
  if (!code || code.length < 2) {
    // Generate code from country name (first 2-3 letters)
    code = countryName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || 'XX';
  }

  // Check for duplicate code
  const existing = userCountries.find(c => c.code.toUpperCase() === code);
  if (existing) return existing;

  const newCountry = {
    code: code,
    name: countryName.trim(),
    flag: flag
  };
  userCountries.push(newCountry);
  localStorage.setItem('travelApp_userCountries_v1', JSON.stringify(userCountries));

  // Refresh country datalist and dropdown
  createCityDatalists();
  if (typeof populateCountrySelect === 'function') {
    populateCountrySelect();
  }

  return newCountry;
}


// Get IATA airport code for a city name (returns '' if not found)
function getCityIataCode(cityName) {
  if (!cityName || cityName === 'Home') return '';
  const rawStr = String(cityName).trim();
  if (!rawStr) return '';

  // Extract explicit 3-letter IATA code if parenthesized: e.g. "Brisbane (BNE)" or "(BNE)"
  const parenMatch = rawStr.match(/\(([A-Za-z]{3})(?:\s*\/.*)?\)/);
  if (parenMatch) return parenMatch[1].toUpperCase();

  const cleanName = rawStr.toLowerCase();

  // Check citiesData first (user's trip cities)
  if (typeof citiesData !== 'undefined' && Array.isArray(citiesData)) {
    const city = citiesData.find(c => c && c.name && c.name.toLowerCase() === cleanName);
    if (city && (city.code || city.iata)) return String(city.code || city.iata).toUpperCase();
  }

  // Fall back to built-in databases by name
  if (typeof ALL_CITIES_BY_NAME_MAP !== 'undefined') {
    const nameMatches = ALL_CITIES_BY_NAME_MAP.get(cleanName);
    if (nameMatches && nameMatches[0] && (nameMatches[0].code || nameMatches[0].iata)) {
      return String(nameMatches[0].code || nameMatches[0].iata).toUpperCase();
    }
  }

  // If already a valid 3-letter code
  if (cleanName.length === 3 && typeof ALL_CITIES_BY_CODE_MAP !== 'undefined') {
    const codeMatch = ALL_CITIES_BY_CODE_MAP.get(cleanName.toUpperCase());
    if (codeMatch && codeMatch.code) return codeMatch.code.toUpperCase();
  }

  // Check aliases / database match
  if (typeof getCityAliasMatch === 'function') {
    const aliasMatch = getCityAliasMatch(cleanName);
    if (aliasMatch && (aliasMatch.code || aliasMatch.iata)) {
      return String(aliasMatch.code || aliasMatch.iata).toUpperCase();
    }
  }

  // Check CITY_DATABASE
  if (typeof CITY_DATABASE !== 'undefined' && Array.isArray(CITY_DATABASE)) {
    const dbCity = CITY_DATABASE.find(c => c && c.name && c.name.toLowerCase() === cleanName);
    if (dbCity && dbCity.code) return dbCity.code.toUpperCase();
  }

  return '';
}

// Get ICAO airport code for a city name (returns '' if not found)
function getCityIcaoCode(cityName) {
  if (!cityName || cityName === 'Home') return '';
  const rawStr = String(cityName).trim();
  if (!rawStr) return '';

  // Extract explicit 4-letter ICAO code if parenthesized: e.g. "Brisbane (BNE / YBBN)"
  const parenIcaoMatch = rawStr.match(/\((?:[A-Za-z]{3}\s*\/\s*)?([A-Za-z]{4})\)/);
  if (parenIcaoMatch) return parenIcaoMatch[1].toUpperCase();

  const cleanName = rawStr.toLowerCase();

  // Check citiesData first (user's trip cities)
  if (typeof citiesData !== 'undefined' && Array.isArray(citiesData)) {
    const city = citiesData.find(c => c && c.name && c.name.toLowerCase() === cleanName);
    if (city && (city.icaoCode || city.icao)) return String(city.icaoCode || city.icao).toUpperCase();
  }

  // Fall back to built-in databases
  if (typeof ALL_CITIES_BY_NAME_MAP !== 'undefined') {
    const nameMatches = ALL_CITIES_BY_NAME_MAP.get(cleanName);
    if (nameMatches && nameMatches[0] && (nameMatches[0].icaoCode || nameMatches[0].icao)) {
      return String(nameMatches[0].icaoCode || nameMatches[0].icao).toUpperCase();
    }
  }

  // Check aliases / database match
  if (typeof getCityAliasMatch === 'function') {
    const aliasMatch = getCityAliasMatch(cleanName);
    if (aliasMatch && (aliasMatch.icaoCode || aliasMatch.icao)) {
      return String(aliasMatch.icaoCode || aliasMatch.icao).toUpperCase();
    }
  }

  // Check CITY_DATABASE
  if (typeof CITY_DATABASE !== 'undefined' && Array.isArray(CITY_DATABASE)) {
    const dbCity = CITY_DATABASE.find(c => c && c.name && c.name.toLowerCase() === cleanName);
    if (dbCity && (dbCity.icaoCode || dbCity.icao)) return String(dbCity.icaoCode || dbCity.icao).toUpperCase();
  }

  return '';
}

// Get formatted airport codes display string (e.g. 'BNE / YBBN', 'BNE', or 'YBBN')
function getCityAirportCodesDisplay(cityName) {
  const iata = getCityIataCode(cityName);
  const icao = getCityIcaoCode(cityName);
  if (iata && icao) return `${iata} / ${icao}`;
  if (iata) return iata;
  if (icao) return icao;
  return '';
}

window.getCityIataCode = getCityIataCode;
window.getCityIcaoCode = getCityIcaoCode;
window.getCityAirportCodesDisplay = getCityAirportCodesDisplay;



if (typeof window !== 'undefined') {
  window.COUNTRY_DATA = COUNTRY_DATA;
  window.EXTENDED_CITY_DATABASE = EXTENDED_CITY_DATABASE;
  window.CITY_DATABASE = CITY_DATABASE;
  window.ALL_CITIES = ALL_CITIES;
  window.ALL_CITIES_BY_NAME_MAP = ALL_CITIES_BY_NAME_MAP;
  window.ALL_CITIES_BY_NAME_COUNTRY_MAP = ALL_CITIES_BY_NAME_COUNTRY_MAP;
  window.ALL_CITIES_BY_CODE_MAP = ALL_CITIES_BY_CODE_MAP;
  window.ALL_CITIES_BY_CITY_ID_MAP = ALL_CITIES_BY_CITY_ID_MAP;
  window.ALL_CITIES_BY_CLEAN_NAME_MAP = ALL_CITIES_BY_CLEAN_NAME_MAP;
  window.ALL_CITIES_HAS_COORDS_SET = ALL_CITIES_HAS_COORDS_SET;
  window.CITY_ALIASES = CITY_ALIASES;
  window.stripDiacritics = stripDiacritics;
  window.calculateLevenshteinDistance = calculateLevenshteinDistance;
  window.calculateSimilarityScore = calculateSimilarityScore;
  window.getCityAliasMatch = getCityAliasMatch;
  window.findFuzzyCityCandidate = findFuzzyCityCandidate;
  window.getCityLocationDatabaseMatch = getCityLocationDatabaseMatch;
  window.cityHasStoredCoords = cityHasStoredCoords;
  window.formatCityTitleCase = formatCityTitleCase;
  window.normalizeCityLocationData = normalizeCityLocationData;
  window.resolveCityLocationLocal = resolveCityLocationLocal;
  window.searchCityOnline = searchCityOnline;
  window.searchCityOnlineCandidates = searchCityOnlineCandidates;
  window.resolveCityLocation = resolveCityLocation;
  window.applyCityLocation = applyCityLocation;
  window.getCountryName = getCountryName;
  window.getCountryFlag = getCountryFlag;
  window.getAllCountries = getAllCountries;
  window.getCityIataCode = getCityIataCode;
  window.getCityIcaoCode = getCityIcaoCode;
  window.getCityAirportCodesDisplay = getCityAirportCodesDisplay;
  window.getUserCities = getUserCities;
  window.userCities = userCities;
  window.addUserCity = addUserCity;
  window.addUserCountry = addUserCountry;
}

if (typeof global !== 'undefined') {
  global.COUNTRY_DATA = COUNTRY_DATA;
  global.EXTENDED_CITY_DATABASE = EXTENDED_CITY_DATABASE;
  global.CITY_DATABASE = CITY_DATABASE;
  global.ALL_CITIES = ALL_CITIES;
  global.ALL_CITIES_BY_NAME_MAP = ALL_CITIES_BY_NAME_MAP;
  global.ALL_CITIES_BY_NAME_COUNTRY_MAP = ALL_CITIES_BY_NAME_COUNTRY_MAP;
  global.ALL_CITIES_BY_CODE_MAP = ALL_CITIES_BY_CODE_MAP;
  global.ALL_CITIES_BY_CITY_ID_MAP = ALL_CITIES_BY_CITY_ID_MAP;
  global.ALL_CITIES_BY_CLEAN_NAME_MAP = ALL_CITIES_BY_CLEAN_NAME_MAP;
  global.ALL_CITIES_HAS_COORDS_SET = ALL_CITIES_HAS_COORDS_SET;
  global.CITY_ALIASES = CITY_ALIASES;
  global.stripDiacritics = stripDiacritics;
  global.calculateLevenshteinDistance = calculateLevenshteinDistance;
  global.calculateSimilarityScore = calculateSimilarityScore;
  global.getCityAliasMatch = getCityAliasMatch;
  global.findFuzzyCityCandidate = findFuzzyCityCandidate;
  global.getCityLocationDatabaseMatch = getCityLocationDatabaseMatch;
  global.cityHasStoredCoords = cityHasStoredCoords;
  global.formatCityTitleCase = formatCityTitleCase;
  global.normalizeCityLocationData = normalizeCityLocationData;
  global.resolveCityLocationLocal = resolveCityLocationLocal;
  global.searchCityOnline = searchCityOnline;
  global.searchCityOnlineCandidates = searchCityOnlineCandidates;
  global.resolveCityLocation = resolveCityLocation;
  global.applyCityLocation = applyCityLocation;
  global.getCountryName = getCountryName;
  global.getCountryFlag = getCountryFlag;
  global.getAllCountries = getAllCountries;
  global.getCityIataCode = getCityIataCode;
  global.getCityIcaoCode = getCityIcaoCode;
  global.getCityAirportCodesDisplay = getCityAirportCodesDisplay;
  global.getUserCities = getUserCities;
  global.userCities = userCities;
  global.addUserCity = addUserCity;
  global.addUserCountry = addUserCountry;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COUNTRY_DATA,
    EXTENDED_CITY_DATABASE,
    CITY_DATABASE,
    ALL_CITIES,
    ALL_CITIES_BY_NAME_MAP,
    ALL_CITIES_BY_NAME_COUNTRY_MAP,
    ALL_CITIES_BY_CODE_MAP,
    ALL_CITIES_BY_CITY_ID_MAP,
    ALL_CITIES_BY_CLEAN_NAME_MAP,
    ALL_CITIES_HAS_COORDS_SET,
    CITY_ALIASES,
    stripDiacritics,
    calculateLevenshteinDistance,
    calculateSimilarityScore,
    getCityAliasMatch,
    findFuzzyCityCandidate,
    getCityLocationDatabaseMatch,
    cityHasStoredCoords,
    formatCityTitleCase,
    normalizeCityLocationData,
    resolveCityLocationLocal,
    searchCityOnline,
    searchCityOnlineCandidates,
    resolveCityLocation,
    applyCityLocation,
    getCountryName,
    getCountryFlag,
    getAllCountries,
    getCityIataCode,
    getCityIcaoCode,
    getCityAirportCodesDisplay,
    getUserCities,
    userCities,
    addUserCity,
    addUserCountry
  };
}
