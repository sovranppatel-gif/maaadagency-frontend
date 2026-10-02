import {
  Target,
  Palette,
  CalendarCheck,
  Headset,
  type LucideIcon,
} from "lucide-react";

export const processSteps = [
  {
    title: "Strategy",
    description: "Your goal, audience and budget decide which channels we use.",
  },
  {
    title: "Creative",
    description: "Concepts and artwork shaped for each medium.",
  },
  {
    title: "Production",
    description: "Printing, fabrication and media bookings, checked before launch.",
  },
  {
    title: "Execution",
    description: "Installations, van routes, screens and events run on the ground.",
  },
  {
    title: "Review",
    description: "We walk you through what ran, where, and plan what comes next.",
  },
];

export type WhyPoint = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const whyPoints: WhyPoint[] = [
  {
    icon: Target,
    title: "Strategy before spend",
    description: "Every plan starts from your objective, not from a media package.",
  },
  {
    icon: Palette,
    title: "Creative made for the medium",
    description: "A hoarding, a van panel and a social post each get artwork built for how they're seen.",
  },
  {
    icon: CalendarCheck,
    title: "Reliable delivery",
    description: "Clear timelines and on-ground follow-through, so campaigns go live when promised.",
  },
  {
    icon: Headset,
    title: "Professional support",
    description: "One point of contact who keeps you updated from brief to launch.",
  },
];
