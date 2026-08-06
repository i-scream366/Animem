"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------
// Typen
// ------------------------------------------------------------

export interface PodiumSeries {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  avgRating: number; // 0–10
}

interface TopThreePodiumProps {
  first: PodiumSeries;
  second: PodiumSeries;
  third: PodiumSeries;
}

// ------------------------------------------------------------
// Konfiguration je Rang: Höhe der Stufe, Bildgröße, Akzentfarbe
// ------------------------------------------------------------

const RANK_CONFIG = {
  1: {
    order: "order-2",
    platformHeight: "h-40 md:h-56",
    imageSize: "h-28 w-28 md:h-40 md:w-40",
    glow: "shadow-[0_0_60px_-10px_rgba(245,185,66,0.55)]",
    ring: "ring-[3px] ring-amber-400",
    badge: "bg-gradient-to-b from-amber-300 to-amber-500 text-black",
    plinth: "bg-gradient-to-b from-amber-500/30 via-amber-400/10 to-transparent",
    delay: 0.15,
  },
  2: {
    order: "order-1",
    platformHeight: "h-28 md:h-40",
    imageSize: "h-20 w-20 md:h-28 md:w-28",
    glow: "shadow-[0_0_40px_-12px_rgba(184,196,208,0.45)]",
    ring: "ring-2 ring-slate-300",
    badge: "bg-gradient-to-b from-slate-200 to-slate-400 text-black",
    plinth: "bg-gradient-to-b from-slate-400/25 via-slate-300/10 to-transparent",
    delay: 0,
  },
  3: {
    order: "order-3",
    platformHeight: "h-20 md:h-28",
    imageSize: "h-16 w-16 md:h-24 md:w-24",
    glow: "shadow-[0_0_30px_-12px_rgba(201,125,72,0.45)]",
    ring: "ring-2 ring-orange-400/80",
    badge: "bg-gradient-to-b from-orange-300 to-orange-600 text-black",
    plinth: "bg-gradient-to-b from-orange-500/25 via-orange-400/10 to-transparent",
    delay: 0.3,
  },
} as const;

function PodiumSlot({
  rank,
  data,
}: {
  rank: 1 | 2 | 3;
  data: PodiumSeries;
}) {
  const cfg = RANK_CONFIG[rank];

  return (
    <div className={cn("flex flex-col items-center", cfg.order)}>
      {/* Thumbnail + Krone */}
      <motion.a
        href={`/series/${data.slug}`}
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: cfg.delay, ease: "easeOut" }}
      >
        {rank === 1 && (
          <motion.div
            className="mb-2"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: [0, -4, 0] }}
            transition={{
              opacity: { delay: 0.5, duration: 0.4 },
              y: { delay: 0.9, duration: 2.4, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Crown className="h-8 w-8 text-amber-400 md:h-10 md:w-10" fill="currentColor" />
          </motion.div>
        )}

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-neutral-900",
            cfg.imageSize,
            cfg.glow,
            cfg.ring
          )}
        >
          <Image
            src={data.thumbnailUrl}
            alt={data.title}
            fill
            className="object-cover"
            sizes="200px"
          />
        </div>

        {/* Rang-Badge */}
        <div
          className={cn(
            "-mt-3 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold md:h-8 md:w-8",
            cfg.badge
          )}
        >
          {rank}
        </div>

        <p className="mt-2 max-w-[9rem] truncate text-center text-sm font-semibold text-neutral-100 md:max-w-[11rem] md:text-base">
          {data.title}
        </p>

        <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {data.avgRating.toFixed(1)}
        </div>
      </motion.a>

      {/* Treppchen-Stufe */}
      <motion.div
        className={cn(
          "mt-4 w-24 rounded-t-lg border-t border-white/10 md:w-36",
          cfg.platformHeight,
          cfg.plinth
        )}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        style={{ transformOrigin: "bottom" }}
        transition={{ duration: 0.6, delay: cfg.delay, ease: "easeOut" }}
      />
    </div>
  );
}

export default function TopThreePodium({ first, second, third }: TopThreePodiumProps) {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-4 py-12">
      <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-neutral-50 md:text-3xl">
        Die beliebtesten Serien
      </h2>
      <div className="flex items-end justify-center gap-3 md:gap-6">
        <PodiumSlot rank={2} data={second} />
        <PodiumSlot rank={1} data={first} />
        <PodiumSlot rank={3} data={third} />
      </div>
    </section>
  );
}
