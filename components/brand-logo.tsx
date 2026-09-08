import Image from "next/image";

const LOGO = {
  src: "/logo.png",
  width: 1400,
  height: 171,
} as const;

export function BrandLogo({
  className = "h-8 w-auto sm:h-10",
  onDark = false,
  preload = false,
}: {
  className?: string;
  onDark?: boolean;
  preload?: boolean;
}) {
  const image = (
    <Image
      src={LOGO.src}
      alt="National Electronics"
      width={LOGO.width}
      height={LOGO.height}
      preload={preload}
      unoptimized
      className={`${className} max-w-full object-contain object-left`}
      style={{ width: "auto" }}
    />
  );

  if (!onDark) return image;

  return (
    <span className="inline-flex max-w-full items-center rounded-xl bg-white px-2.5 py-1.5">
      {image}
    </span>
  );
}
