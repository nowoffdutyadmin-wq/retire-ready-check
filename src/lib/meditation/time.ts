export function firstName(fullName: string | null | undefined) {
  return (fullName || "there").trim().split(/\s+/)[0] || "there";
}

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function formatDuration(seconds: number | null | undefined) {
  const safeSeconds = Math.max(0, seconds ?? 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function localCompletionDate(timezone: string, date = new Date()) {
  const localParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const part = (type: string) => localParts.find((item) => item.type === type)?.value ?? "00";
  const localMidnight = new Date(
    `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:00`,
  );
  localMidnight.setHours(localMidnight.getHours() - 3);
  return localMidnight.toISOString().slice(0, 10);
}

export function timezoneLabel(timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "short",
      hour: "numeric",
      minute: "2-digit",
    }).formatToParts(new Date());
    return parts.map((part) => part.value).join("");
  } catch {
    return timezone;
  }
}

export function isPastLocalMidday(timezone: string, date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
  return hour >= 12;
}
