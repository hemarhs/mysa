import { cn } from "@/lib/cn";

/** The Mysa wordmark: set in the display serif with a wide, calm track. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-serif text-[1.375rem] font-normal leading-none tracking-[0.34em] uppercase",
        className
      )}
    >
      Mysa
    </span>
  );
}
