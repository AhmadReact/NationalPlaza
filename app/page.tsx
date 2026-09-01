import { BrandsMarquee } from "@/components/brands-marquee";
import { Categories } from "@/components/categories";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Heritage } from "@/components/heritage";
import { HeroSlider } from "@/components/hero-slider";
import { HomePromoBanners } from "@/components/storefront-banners";
import { HomeProducts } from "@/components/home-products";
import { Testimonials } from "@/components/testimonials";
import { TrustStrip } from "@/components/trust-strip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSlider />
        <TrustStrip />
        <Categories />
        <HomePromoBanners />
        <HomeProducts />
        <BrandsMarquee />
        <Heritage />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
