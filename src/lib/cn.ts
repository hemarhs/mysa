type ClassValue = string | false | null | undefined | ClassValue[];

/**
 * Joins class names, dropping falsey values and flattening nested arrays.
 *
 * The array case matters: a conditional branch in a component often produces
 * a *group* of classes, and forcing every one of those into a single string
 * literal is how class lists become unreadable.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(value);
    }
  }

  return out.join(" ");
}
