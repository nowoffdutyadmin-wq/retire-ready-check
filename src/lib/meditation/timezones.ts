const intlWithSupportedValues = Intl as typeof Intl & {
  supportedValuesOf?: (input: "timeZone") => string[];
};

const preferredTimezones = [
  "America/Montevideo",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Pacific/Auckland",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Berlin",
  "Europe/Rome",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
];

const friendlyNames: Record<string, string> = {
  "Africa/Johannesburg": "South Africa - Johannesburg",
  "America/Argentina/Buenos_Aires": "Argentina - Buenos Aires",
  "America/Chicago": "United States - Central",
  "America/Denver": "United States - Mountain",
  "America/Los_Angeles": "United States - Pacific",
  "America/Mexico_City": "Mexico - Mexico City",
  "America/Montevideo": "Uruguay - Montevideo",
  "America/New_York": "United States - Eastern",
  "America/Phoenix": "United States - Arizona",
  "America/Sao_Paulo": "Brazil - Sao Paulo",
  "America/Toronto": "Canada - Toronto",
  "America/Vancouver": "Canada - Vancouver",
  "Asia/Dubai": "United Arab Emirates - Dubai",
  "Asia/Kolkata": "India - Kolkata",
  "Asia/Singapore": "Singapore",
  "Asia/Tokyo": "Japan - Tokyo",
  "Australia/Adelaide": "Australia - Adelaide",
  "Australia/Brisbane": "Australia - Brisbane",
  "Australia/Melbourne": "Australia - Melbourne",
  "Australia/Perth": "Australia - Perth",
  "Australia/Sydney": "Australia - Sydney",
  "Europe/Berlin": "Germany - Berlin",
  "Europe/Dublin": "Ireland - Dublin",
  "Europe/London": "United Kingdom - London",
  "Europe/Madrid": "Spain - Madrid",
  "Europe/Paris": "France - Paris",
  "Europe/Rome": "Italy - Rome",
  "Pacific/Auckland": "New Zealand - Auckland",
};

export const defaultTimezone = "Australia/Sydney";

function offsetLabel(timezone: string, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value ?? timezone;
  } catch {
    return timezone;
  }
}

export function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTimezone;
  } catch {
    return defaultTimezone;
  }
}

export function timezoneDisplayName(timezone: string) {
  const fallback = timezone
    .replace(/_/g, " ")
    .replace(/\//g, " - ");
  return `${friendlyNames[timezone] ?? fallback} (${timezone}, ${offsetLabel(timezone)})`;
}

export function allTimezoneOptions() {
  const supported = intlWithSupportedValues.supportedValuesOf?.("timeZone") ?? [];
  const unique = new Set([...preferredTimezones, ...supported]);
  const preferred = preferredTimezones
    .filter((timezone) => unique.has(timezone))
    .map((timezone) => ({ value: timezone, label: timezoneDisplayName(timezone) }));
  const other = [...unique]
    .filter((timezone) => !preferredTimezones.includes(timezone))
    .sort()
    .map((timezone) => ({ value: timezone, label: timezoneDisplayName(timezone) }));

  return { preferred, other };
}

export function isSupportedTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}
