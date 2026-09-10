export function formatApiDate(value?: string | null) {
  if (!value) return "Data não informada";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function displayDateToApi(value: string) {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function isValidDisplayDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const apiDate = displayDateToApi(value);
  if (!apiDate) return false;
  const [year, month, day] = apiDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function todayApiDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDisplayDate() {
  return formatApiDate(todayApiDate());
}

export function dateRelation(apiDate: string) {
  const today = todayApiDate();
  if (apiDate < today) return "OVERDUE" as const;
  if (apiDate === today) return "TODAY" as const;
  return "UPCOMING" as const;
}

export function daysUntil(apiDate: string) {
  const target = new Date(`${apiDate}T12:00:00`);
  const today = new Date(`${todayApiDate()}T12:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

const TIME_MARKER = "[CLYVO_TIME=";

export function encodeReasonWithTime(reason: string, time: string) {
  return `${TIME_MARKER}${time}] ${reason.trim()}`;
}

export function decodeReasonWithTime(reason?: string | null) {
  if (!reason?.startsWith(TIME_MARKER)) {
    return { time: null, reason: reason ?? "" };
  }
  const markerEnd = reason.indexOf("]");
  if (markerEnd < 0) return { time: null, reason };
  return {
    time: reason.slice(TIME_MARKER.length, markerEnd),
    reason: reason.slice(markerEnd + 1).trim(),
  };
}
