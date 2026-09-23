/**
 * A closed list of Lucide icons the admin can choose from. Free text would let
 * a typo silently render nothing on the storefront, and an explicit list keeps
 * the bundle to just these icons instead of all of Lucide.
 */
export const TRUST_ICONS = [
  { name: "croissant", label: "Випічка" },
  { name: "cake-slice", label: "Шматок торта" },
  { name: "wheat", label: "Колосок" },
  { name: "leaf", label: "Листок" },
  { name: "heart", label: "Серце" },
  { name: "crown", label: "Корона" },
  { name: "truck", label: "Доставка" },
  { name: "package", label: "Коробка" },
  { name: "clock", label: "Годинник" },
  { name: "shield-check", label: "Щит" },
  { name: "star", label: "Зірка" },
  { name: "thumbs-up", label: "Великий палець" },
] as const;

export type TrustIconName = (typeof TRUST_ICONS)[number]["name"];

export const TRUST_ICON_NAMES = TRUST_ICONS.map(
  (icon) => icon.name,
) as TrustIconName[];

export function isTrustIcon(value: string): value is TrustIconName {
  return TRUST_ICON_NAMES.includes(value as TrustIconName);
}
