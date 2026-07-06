import {
  airConditioners,
  airCoolers,
  ledTvs,
  refrigerators,
} from "@/lib/data";
import { BrandsMarquee } from "@/components/brands-marquee";
import { Categories } from "@/components/categories";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Heritage } from "@/components/heritage";
import { HeroSlider } from "@/components/hero-slider";
import { ProductSection } from "@/components/product-section";
import { Testimonials } from "@/components/testimonials";
import { TrustStrip } from "@/components/trust-strip";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSlider />
        <TrustStrip />
        <Categories />
        <ProductSection
          id="air-conditioners"
          title="Air Conditioners"
          tagline="DC inverter split ACs built for Pakistani summers — save up to 60% on electricity"
          products={airConditioners}
          accent="brand"
        />
        <BrandsMarquee />
        <ProductSection
          id="refrigerators"
          title="Refrigerators"
          tagline="Inverter refrigerators from Dawlance, Haier, PEL & Homage in every size"
          products={refrigerators}
          accent="emerald"
        />
        <Heritage />
        <ProductSection
          id="air-coolers"
          title="Air Coolers"
          tagline="Powerful, budget-friendly room coolers with ice-box technology"
          products={airCoolers}
          accent="teal"
        />
        <ProductSection
          id="led-tvs"
          title="LED TVs"
          tagline="4K Smart, QLED & Android TVs with official brand warranty"
          products={ledTvs}
          accent="violet"
        />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
