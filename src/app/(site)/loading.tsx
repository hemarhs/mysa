export default function Loading() {
  return (
    <div className="flex min-h-[70svh] items-center justify-center bg-espresso" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <span className="relative block h-px w-32 overflow-hidden bg-hairline">
        <span className="absolute inset-y-0 left-0 block w-1/3 animate-[sweep_1.4s_ease-in-out_infinite] bg-gold" />
      </span>
    </div>
  );
}
