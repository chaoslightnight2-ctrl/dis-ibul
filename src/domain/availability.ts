export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function generateSlotTimes(opensAt: string, closesAt: string, durationMinutes: number) {
  const start = timeToMinutes(opensAt);
  const end = timeToMinutes(closesAt);
  const slots: string[] = [];
  for (let value = start; value + durationMinutes <= end; value += durationMinutes) {
    slots.push(minutesToTime(value));
  }
  return slots;
}

export function istanbulDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`);
}

export function dateKeyInIstanbul(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
