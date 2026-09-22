import { neonConfig } from "@neondatabase/serverless";

/**
 * Retries Neon's HTTP transport on transient network failures.
 *
 * The serverless driver makes one HTTPS request per query, so a single flaky
 * DNS lookup or dropped socket aborts whatever is running — which on a
 * migration or a seed means a half-applied change. Domestic connections drop
 * requests often enough that this is worth having in production too, not only
 * for scripts.
 *
 * Only network-level failures are retried. An HTTP response of any status is
 * returned untouched: a rejected password or a bad query must fail on the
 * first attempt, not four seconds later.
 */

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 350;

const TRANSIENT_CODES = [
  "ENOTFOUND",       // DNS did not resolve (often a cold or flaky resolver)
  "EAI_AGAIN",       // temporary DNS failure
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "ENETUNREACH",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "UND_ERR_HEADERS_TIMEOUT",
];

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause as { message?: string; code?: string } | undefined;
  return [error.message, cause?.message, cause?.code].filter(Boolean).join(" ");
}

function isTransient(error: unknown): boolean {
  const text = describe(error);
  if (!text) return false;
  if (TRANSIENT_CODES.some((code) => text.includes(code))) return true;
  return /fetch failed|network|socket hang up|timeout|terminated/i.test(text);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let installed = false;

/**
 * Installs the retrying transport. Safe to call more than once; the driver
 * reads this from module-level config, so it must run before the first query.
 */
export function installResilientFetch(options: { verbose?: boolean } = {}) {
  if (installed) return;
  installed = true;

  const baseFetch: typeof fetch = globalThis.fetch.bind(globalThis);

  neonConfig.fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await baseFetch(input, init);
      } catch (error) {
        lastError = error;

        if (!isTransient(error) || attempt === MAX_ATTEMPTS) break;

        // Exponential backoff with jitter, so a cold DNS cache or a suspended
        // Neon compute has time to come good.
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 200;

        if (options.verbose) {
          console.warn(
            `  network hiccup (${describe(error)}) — retrying in ${Math.round(delay)}ms ` +
              `[${attempt}/${MAX_ATTEMPTS - 1}]`
          );
        }

        await wait(delay);
      }
    }

    throw lastError;
  };
}
