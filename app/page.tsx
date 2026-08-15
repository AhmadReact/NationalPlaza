import { BrandsMarquee } from "@/components/brands-marquee";
import { Categories } from "@/components/categories";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Heritage } from "@/components/heritage";
import { HeroSlider } from "@/components/hero-slider";
import { HomeProducts } from "@/components/home-products";
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
        <HomeProducts />
        <BrandsMarquee />
        <Heritage />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
