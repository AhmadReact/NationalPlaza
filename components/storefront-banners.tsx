"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  isExternalHref,
  storefrontBannerHref,
  useGetStoreBannersQuery,
  type Banner,
  type StoreBannerParams,
} from "@/app/admin/(panel)/banners/store/bannerAPI";

export function useLiveStoreBanners(params: StoreBannerParams, skip = false) {
  const { refetch, ...query } = useGetStoreBannersQuery(params, {
    skip,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    function onFocus() {
      void refetch();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetch]);

  return { refetch, ...query };
}

export function BannerImage({
  banner,
  className,
  imgClassName,
}: {
  banner: Banner;
  className?: string;
  imgClassName?: string;
}) {
  if (!banner.imageUrl) return null;
  const alt = banner.alt ?? banner.title;

  return (
    <picture className={["block", className].filter(Boolean).join(" ")}>
      {banner.mobileImageUrl ? (
        <source media="(max-width: 768px)" srcSet={banner.mobileImageUrl} />
      ) : null}
      <img
        src={banner.imageUrl}
        alt={alt}
        className={["block", imgClassName].filter(Boolean).join(" ")}
      />
    </picture>
  );
}

export function BannerLink({
  banner,
  className,
  children,
}: {
  banner: Banner;
  className?: string;
  children: React.ReactNode;
}) {
  const href = storefrontBannerHref(banner);
  if (!href) {
    return <div className={className}>{children}</div>;
  }
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function HomePromoBanners() {
  const { data } = useLiveStoreBanners({ placement: "HOME_PROMO" });
  const banners = (data?.data ?? []).filter((banner) => banner.imageUrl);
  if (banners.length === 0) return null;

  const columns =
    banners.length === 1
      ? "grid-cols-1"
      : banners.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className={`grid gap-4 ${columns}`}>
        {banners.map((banner) => (
          <BannerLink
            key={banner.id}
            banner={banner}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <BannerImage
              banner={banner}
              className="block"
              imgClassName="h-44 w-full object-cover sm:h-56"
            />
            {banner.subtitle ? (
              <div className="px-4 py-3">
                <p className="font-display text-sm font-bold text-brand-950">
                  {banner.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{banner.subtitle}</p>
              </div>
            ) : null}
          </BannerLink>
        ))}
      </div>
    </section>
  );
}

export function CategoryBanners({ categoryId }: { categoryId: string }) {
  const { data } = useLiveStoreBanners(
    { placement: "CATEGORY", categoryId },
    !categoryId,
  );
  const banners = (data?.data ?? []).filter((banner) => banner.imageUrl);
  if (banners.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {banners.map((banner) => (
        <BannerLink
          key={banner.id}
          banner={banner}
          className="block overflow-hidden rounded-2xl border border-slate-200"
        >
          <BannerImage
            banner={banner}
            className="block"
            imgClassName="h-40 w-full object-cover sm:h-52"
          />
        </BannerLink>
      ))}
    </div>
  );
}

export function ProductBanners({ productId }: { productId: string }) {
  const { data } = useLiveStoreBanners(
    { placement: "PRODUCT", productId },
    !productId,
  );
  const banners = (data?.data ?? []).filter((banner) => banner.imageUrl);
  if (banners.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      {banners.map((banner) => (
        <BannerLink
          key={banner.id}
          banner={banner}
          className="block overflow-hidden rounded-2xl border border-slate-200"
        >
          <BannerImage
            banner={banner}
            className="block"
            imgClassName="h-28 w-full object-cover sm:h-36"
          />
        </BannerLink>
      ))}
    </div>
  );
}
