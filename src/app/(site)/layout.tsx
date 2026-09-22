import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ReservationProvider } from "@/components/reserve/ReservationProvider";
import { ScrollProgress } from "@/components/site/ScrollProgress";

/** Chrome for the public-facing site. The admin panel uses its own. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReservationProvider>
      <ScrollProgress />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[100] focus:bg-gold focus:px-5 focus:py-3 focus:font-sans focus:text-[0.8125rem] focus:uppercase focus:tracking-[0.16em] focus:text-espresso"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </ReservationProvider>
  );
}
