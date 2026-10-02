import {
  Newspaper,
  Tv,
  Radio,
  Printer,
  Landmark,
  Truck,
  PaintRoller,
  MonitorPlay,
  Megaphone,
  PartyPopper,
  Gift,
  Lightbulb,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Newspaper,
  Tv,
  Radio,
  Printer,
  Landmark,
  Truck,
  PaintRoller,
  MonitorPlay,
  Megaphone,
  PartyPopper,
  Gift,
  Lightbulb,
  Sparkles,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Sparkles;
}
