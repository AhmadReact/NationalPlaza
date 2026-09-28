import type { ProductVideo } from "@/app/store/customerAPI";

const ASPECT_RATIO: Record<ProductVideo["provider"], string> = {
  YOUTUBE: "16 / 9",
  FACEBOOK: "16 / 9",
  INSTAGRAM: "9 / 16",
};

const MOBILE_PLAYER_WIDTH = 320;
const MOBILE_PLAYER_HEIGHT = 569;

export type GalleryVideo = ProductVideo & { portrait?: boolean };

export function isMobileVideo(video: GalleryVideo): boolean {
  if (video.portrait || video.provider === "INSTAGRAM") return true;
  const source = `${video.url} ${video.embedUrl}`;
  return /\/share\/r\/|\/reel\//i.test(source);
}

export function playerSrc(video: GalleryVideo, mobile: boolean): string {
  if (!mobile || video.provider !== "FACEBOOK") return video.embedUrl;
  try {
    const url = new URL(video.embedUrl);
    url.searchParams.set("width", String(MOBILE_PLAYER_WIDTH));
    url.searchParams.set("height", String(MOBILE_PLAYER_HEIGHT));
    return url.toString();
  } catch {
    return video.embedUrl;
  }
}

export function ProductIntroVideo({
  video,
  productName,
  fit = "standalone",
}: {
  video: GalleryVideo;
  productName: string;
  fit?: "standalone" | "stage";
}) {
  const mobile = isMobileVideo(video);
  const aspectRatio = mobile ? "9 / 16" : ASPECT_RATIO[video.provider];
  const scaleFacebook = fit === "stage" && mobile && video.provider === "FACEBOOK";

  return (
    <div
      className={
        fit === "stage"
          ? "relative h-full w-full overflow-hidden [container-type:size]"
          : mobile
            ? "relative mx-auto mt-6 w-full max-w-[320px] overflow-hidden rounded-3xl"
            : "relative mt-6 w-full overflow-hidden rounded-3xl"
      }
      style={fit === "stage" ? undefined : { aspectRatio }}
    >
      <iframe
        src={playerSrc(video, mobile)}
        title={`${productName} video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className={
          scaleFacebook
            ? "absolute top-0 left-0 border-0"
            : "absolute inset-0 h-full w-full border-0"
        }
        style={
          scaleFacebook
            ? {
                width: MOBILE_PLAYER_WIDTH,
                height: MOBILE_PLAYER_HEIGHT,
                transform: `scale(calc(100cqw / ${MOBILE_PLAYER_WIDTH}px))`,
                transformOrigin: "top left",
              }
            : undefined
        }
      />
    </div>
  );
}
