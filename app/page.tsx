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
import { fetchHomePage, fetchStoreBanners } from "@/app/store/storefrontServer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [heroBanners, promoBanners, home] = await Promise.all([
    fetchStoreBanners("HOME_HERO").catch(() => []),
    fetchStoreBanners("HOME_PROMO").catch(() => []),
    fetchHomePage().catch(() => null),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSlider initialBanners={heroBanners} />
        <TrustStrip />
        <Categories initialCategories={home?.categories ?? []} />
        <HomePromoBanners initialBanners={promoBanners} />
        <HomeProducts initialPage={home} />
        <BrandsMarquee />
        <Heritage />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
