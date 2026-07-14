import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Heart, MapPin, ChevronUp, ChevronDown, Play, Pause } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Reels() {
  const navigate = useNavigate();
  const { publishedReels, toggleReelLike } = useApp();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  if (publishedReels.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <p>Нет доступных Reels</p>
        <button onClick={() => navigate(-1)} className="mt-4 rounded-xl bg-white/10 px-5 py-2">Назад</button>
      </div>
    );
  }

  const reel = publishedReels[Math.min(index, publishedReels.length - 1)];
  const goUp = () => setIndex((i) => Math.max(0, i - 1));
  const goDown = () => setIndex((i) => Math.min(publishedReels.length - 1, i + 1));

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative mx-auto h-full max-w-md">
        {reel.videoUri ? (
          <video
            key={reel.id}
            src={reel.videoUri}
            poster={reel.coverImage}
            autoPlay={playing}
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
            onClick={() => setPlaying((p) => !p)}
          />
        ) : (
          <img src={reel.coverImage} alt={reel.title} className="h-full w-full object-cover" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">
            <X size={20} />
          </button>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {index + 1} / {publishedReels.length}
          </span>
        </div>

        {/* Play toggle */}
        <button
          onClick={() => setPlaying((p) => !p)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/0 transition-colors"
        >
          {!playing && <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 text-white"><Play size={32} fill="white" /></span>}
        </button>

        {/* Right actions */}
        <div className="absolute bottom-32 right-4 flex flex-col items-center gap-5">
          <button onClick={() => toggleReelLike(reel.id)} className="flex flex-col items-center gap-1 text-white">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Heart size={24} className={reel.likedByMe ? "text-coral" : "text-white"} fill={reel.likedByMe ? "#FF6B6B" : "transparent"} />
            </span>
            <span className="text-xs font-semibold">{reel.likesCount.toLocaleString("ru-RU")}</span>
          </button>
          <button onClick={() => setPlaying((p) => !p)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">
            {playing ? <Pause size={22} /> : <Play size={22} fill="white" />}
          </button>
        </div>

        {/* Nav arrows */}
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3">
          <button onClick={goUp} disabled={index === 0} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur disabled:opacity-30"><ChevronUp size={20} /></button>
          <button onClick={goDown} disabled={index === publishedReels.length - 1} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur disabled:opacity-30"><ChevronDown size={20} /></button>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-6 left-4 right-20 text-white">
          <h2 className="mb-1 text-lg font-extrabold">{reel.title}</h2>
          <div className="mb-2 flex items-center gap-1.5 text-sm text-white/80">
            <MapPin size={14} /> {reel.city} · {reel.tourTitle}
          </div>
          <p className="mb-2 line-clamp-3 text-sm text-white/70">{reel.story}</p>
          <div className="text-xs text-white/60">{reel.author}</div>
        </div>
      </div>
    </div>
  );
}
