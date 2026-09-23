"use client";

import {
  Cake,
  CheckCircle,
  Clock,
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

const ICONS: Record<TrustIconName, typeof Heart> = {
  croissant: Croissant,
  "cake-slice": Cake,
  wheat: Wheat,
  leaf: Leaf,
  heart: Heart,
  crown: Crown,
  truck: Truck,
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
  const Icon = ICONS[name as TrustIconName] ?? CheckCircle;
  return <Icon size={size} strokeWidth={1.75} aria-hidden />;
}
