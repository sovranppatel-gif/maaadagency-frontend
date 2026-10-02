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
  type LucideIcon,
} from "lucide-react";

export type Service = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const services: Service[] = [
  {
    icon: Newspaper,
    title: "Print Media",
    description:
      "Newspaper, magazine and classified ads that put your brand in front of a trusted, engaged readership.",
  },
  {
    icon: Tv,
    title: "Electronic Media",
    description:
      "TV commercials across local and national channels for wide-reaching, high-recall brand exposure.",
  },
  {
    icon: Radio,
    title: "Radio Ads",
    description:
      "Radio spots on leading FM stations that reach audiences on the move, fast and affordably.",
  },
  {
    icon: Printer,
    title: "Flex & Offset Printing",
    description:
      "Flex, vinyl, standees and offset print — pamphlets, brochures, visiting cards, calendars and stickers.",
  },
  {
    icon: Landmark,
    title: "Outdoor Advertising",
    description:
      "Hoardings, bus branding, cycle and e-rickshaw branding that put your brand on Raipur's streets.",
  },
  {
    icon: Truck,
    title: "Promotional Vans",
    description:
      "Branded van and hydraulic LED van promotions that carry your message directly to your audience.",
  },
  {
    icon: PaintRoller,
    title: "Digital Wall Painting",
    description:
      "High-impact printed wall branding for long-lasting visibility in high-traffic locations.",
  },
  {
    icon: MonitorPlay,
    title: "LED Screens",
    description:
      "Indoor and outdoor LED display solutions installed at malls, entrances and high-footfall zones.",
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    description:
      "Social media, content and email marketing, SEO and Google Ads that grow your brand online.",
  },
  {
    icon: PartyPopper,
    title: "Event Management",
    description:
      "End-to-end planning for corporate and private events, from concept to flawless execution.",
  },
  {
    icon: Gift,
    title: "Corporate Gifting",
    description:
      "Customized corporate gifts and merchandise that strengthen client and employee relationships.",
  },
  {
    icon: Lightbulb,
    title: "Brand Strategy",
    description:
      "Creative strategy and positioning that turns your ideas into a brand people remember.",
  },
];
