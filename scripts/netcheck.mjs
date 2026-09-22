/**
 * Is the Neon endpoint reachable from this machine at all?
 *
 *   node --env-file=.env.local netcheck.mjs
 *
 * Separates a network/DNS/TLS problem from a driver or credentials problem.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL is not set.");
  process.exit(1);
}

let host;
try {
  const parsed = new URL(url);
  host = parsed.hostname;
  console.log("\nhost:     " + host);
  console.log("user:     " + parsed.username);
  console.log("database: " + parsed.pathname.slice(1));
  console.log("password: " + (parsed.password ? `${parsed.password.length} characters` : "MISSING"));

  // A password copied from the masked field shows up as dots or asterisks.
  if (/[•*]/.test(parsed.password)) {
    console.log("\n  ⚠ The password contains • or * characters — that is the masked");
    console.log("    display text, not the real password. Use 'Copy snippet'.");
  }
} catch (e) {
  console.log("DATABASE_URL could not be parsed: " + e.message);
  process.exit(1);
}

console.log("\n--- reachability ---\n");

async function attempt(label, target, options = {}) {
  const started = Date.now();
  try {
    const res = await fetch(target, { ...options, signal: AbortSignal.timeout(20000) });
    console.log(`  OK    ${label} — HTTP ${res.status} in ${Date.now() - started}ms`);
    return true;
  } catch (e) {
    const cause = e.cause?.message ?? e.cause?.code ?? "";
    console.log(`  FAIL  ${label} — ${e.message}${cause ? "  (" + cause + ")" : ""}`);
    return false;
  }
}

const internet = await attempt("general internet (example.com)", "https://example.com");
const neon = await attempt(`neon endpoint (${host})`, `https://${host}/sql`, { method: "POST" });

console.log("");
if (!internet) {
  console.log("  No internet at all from Node. Check a VPN, proxy or firewall.");
} else if (!neon) {
  console.log("  The internet works but this host does not. Something between you and");
  console.log("  Neon is blocking it — most often a VPN, corporate/campus firewall, or");
  console.log("  ISP DNS. Try a phone hotspot; if that works, it is the network.");
} else {
  console.log("  The endpoint is reachable. If the driver still fails, the credentials");
  console.log("  are wrong — use 'Copy snippet' in the Neon Connect panel.");
}
console.log("");
