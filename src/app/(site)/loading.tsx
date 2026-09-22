/**
 * Route-level loading state. A single gold hairline sweeping in a narrow
 * track — the same gesture as the preloader's progress rule, so a slow
 * navigation feels like part of the same object rather than a spinner
 * borrowed from somewhere else.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-[70svh] items-center justify-center bg-espresso"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      <span className="relative block h-px w-40 overflow-hidden bg-hairline">
        <span className="absolute inset-y-0 left-0 block w-1/3 bg-gold motion-safe:animate-[sweep_1.5s_cubic-bezier(0.25,0.46,0.45,0.94)_infinite]" />
      </span>
    </div>
  );
}
