import type { ServiceItem } from "@/lib/types";

export const services: ServiceItem[] = [
  { id: "svc-1", name: "Print Media", description: "Newspaper, magazine and classified ads.", icon: "Newspaper", status: "Active", leadsCount: 18 },
  { id: "svc-2", name: "Electronic Media", description: "TV commercials across local and national channels.", icon: "Tv", status: "Active", leadsCount: 9 },
  { id: "svc-3", name: "Radio Ads", description: "Radio spots on leading FM stations.", icon: "Radio", status: "Active", leadsCount: 6 },
  { id: "svc-4", name: "Flex & Offset Printing", description: "High-quality flex, vinyl, standee and offset printing.", icon: "Printer", status: "Active", leadsCount: 22 },
  { id: "svc-5", name: "Outdoor Advertising", description: "Hoardings, bus branding, cycle and e-rickshaw branding.", icon: "Landmark", status: "Active", leadsCount: 27 },
  { id: "svc-6", name: "Promotional Vans", description: "Branded van and hydraulic LED van promotions.", icon: "Truck", status: "Active", leadsCount: 14 },
  { id: "svc-7", name: "Digital Wall Painting", description: "High-impact printed wall branding.", icon: "PaintRoller", status: "Active", leadsCount: 11 },
  { id: "svc-8", name: "LED Screens", description: "Indoor and outdoor LED display solutions.", icon: "MonitorPlay", status: "Active", leadsCount: 16 },
  { id: "svc-9", name: "Digital Marketing", description: "Social media, SEO and Google Ads campaigns.", icon: "Megaphone", status: "Active", leadsCount: 34 },
  { id: "svc-10", name: "Event Management", description: "End-to-end planning for corporate and private events.", icon: "PartyPopper", status: "Active", leadsCount: 8 },
  { id: "svc-11", name: "Corporate Gifting", description: "Customized corporate gifts and merchandise.", icon: "Gift", status: "Active", leadsCount: 5 },
  { id: "svc-12", name: "Brand Strategy", description: "Creative strategy and positioning.", icon: "Lightbulb", status: "Disabled", leadsCount: 12 },
];

export function getServiceById(id?: string) {
  return services.find((s) => s.id === id);
}
