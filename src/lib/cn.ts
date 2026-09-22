/** Joins class names, dropping falsey values. */
export function cn(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}
