/** Formats minor currency units for display, e.g. 625 -> "$6.25". */
export function formatPrice(cents: number, currency = "USD", locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** "07:00" -> "7am", "18:30" -> "6:30pm". Compact, for the hours table. */
export function formatTime(value: string) {
  const [hRaw, mRaw] = value.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw ?? 0);
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Collapses consecutive days with identical hours: "Mon – Thu  7am – 6pm". */
export function groupHours(
  hours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[]
) {
  const ordered = [1, 2, 3, 4, 5, 6, 0]
    .map((d) => hours.find((h) => h.dayOfWeek === d))
    .filter((h): h is NonNullable<typeof h> => Boolean(h));

  const groups: { label: string; value: string }[] = [];

  for (const hour of ordered) {
    const value = hour.isClosed
      ? "Closed"
      : `${formatTime(hour.opensAt)} – ${formatTime(hour.closesAt)}`;
    const short = DAY_NAMES[hour.dayOfWeek].slice(0, 3);
    const last = groups.at(-1);

    if (last && last.value === value) {
      const [start] = last.label.split(" – ");
      last.label = `${start} – ${short}`;
    } else {
      groups.push({ label: short, value });
    }
  }

  return groups;
}

/** True when the café is open at `now`, based on the stored opening hours. */
export function isOpenNow(
  hours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[],
  now = new Date()
) {
  const today = hours.find((h) => h.dayOfWeek === now.getDay());
  if (!today || today.isClosed) return false;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (v: string) => {
    const [h, m] = v.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  return minutes >= toMinutes(today.opensAt) && minutes < toMinutes(today.closesAt);
}
