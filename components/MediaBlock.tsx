import type { MediaItem } from "@/lib/content";

// 상세 화면의 미디어 렌더러.
// - image: <img>
// - video(youtube/vimeo): 링크 임베드(iframe)  ← 긴 영상
// - video(file): 직접 업로드된 짧은 영상 <video>
export function MediaBlock({ item }: { item: MediaItem }) {
  if (item.type === "image") {
    return (
      <figure className="media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={item.alt ?? ""} loading="lazy" />
        {item.caption ? <figcaption>{item.caption}</figcaption> : null}
      </figure>
    );
  }

  if (item.provider === "youtube" || item.provider === "vimeo") {
    const embedSrc =
      item.provider === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${item.src}`
        : `https://player.vimeo.com/video/${item.src}`;
    return (
      <figure className="media media--video">
        <div className="video-frame">
          <iframe
            src={embedSrc}
            title={item.caption ?? "video"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {item.caption ? <figcaption>{item.caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="media media--video">
      <video src={item.src} controls preload="metadata" />
      {item.caption ? <figcaption>{item.caption}</figcaption> : null}
    </figure>
  );
}
