"use client";

import {
  Cake,
  CheckCircle,
  Clock,
  CreditCard,
  Croissant,
  Crown,
  Heart,
  Leaf,
  Package,
  ShieldCheck,
  Star,
  ThumbsUp,
  Truck,
  Wheat,
} from "lucide-react";
import type { TrustIconName } from "@/lib/trust-icons";

/**
 * Lucide dropped brand marks, so the Instagram glyph is drawn here. It matters
 * for the «78 000+ підписників» trust item, where a generic camera would read
 * as "photos" rather than "our Instagram".
 */
function InstagramGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** `instagram` is handled separately by InstagramGlyph above. */
const ICONS: Record<Exclude<TrustIconName, "instagram">, typeof Heart> = {
  croissant: Croissant,
  "cake-slice": Cake,
  wheat: Wheat,
  leaf: Leaf,
  heart: Heart,
  crown: Crown,
  truck: Truck,
  "credit-card": CreditCard,
  package: Package,
  clock: Clock,
  "shield-check": ShieldCheck,
  star: Star,
  "thumbs-up": ThumbsUp,
};

export function TrustIcon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  if (name === "instagram") return <InstagramGlyph size={size} />;

  const Icon =
    ICONS[name as Exclude<TrustIconName, "instagram">] ?? CheckCircle;
  return <Icon size={size} strokeWidth={1.75} aria-hidden />;
}
