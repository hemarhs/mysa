import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ReservationProvider } from "@/components/reserve/ReservationProvider";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { Preloader } from "@/components/chrome/Preloader";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { PageTransition } from "@/components/chrome/PageTransition";

/**
 * Chrome for the public-facing site. The admin panel deliberately uses its
 * own, much quieter shell — no preloader and no smooth-scroll hijack, because
 * it is a tool people use all day.
 *
 * Order matters here: SmoothScroll must wrap everything that scrolls, and
 * the preloader sits above all of it so it can cover the page while the
 * first paint settles.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReservationProvider>
      <SmoothScroll>
        <Preloader />
        <ScrollProgress />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[180] focus:bg-gold focus:px-6 focus:py-3.5 focus:font-sans focus:text-[0.75rem] focus:font-semibold focus:uppercase focus:tracking-[0.2em] focus:text-espresso"
        >
          Skip to content
        </a>

        <Header />

        <main id="main" className="relative">
          <PageTransition>{children}</PageTransition>
        </main>

        <Footer />
      </SmoothScroll>
    </ReservationProvider>
  );
}
