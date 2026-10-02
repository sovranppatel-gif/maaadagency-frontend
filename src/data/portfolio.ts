export type PortfolioCategory =
  | "Outdoor Advertising"
  | "LED"
  | "Promotional Vans"
  | "Wall Painting"
  | "Print"
  | "Events";

export type PortfolioItem = {
  image: string;
  /** Describes what is actually visible in the photo. */
  alt: string;
  title: string;
  description: string;
  location?: string;
  categories: PortfolioCategory[];
};

// The BNI hydraulic LED van campaign is deliberately not listed here: it is
// presented in full in the case study section (see data/caseStudy.ts).
export const portfolio: PortfolioItem[] = [
  {
    image: "/images/work/promo-van-paint.jpg",
    alt: "Promotional van wrapped in Nippon Paint branding parked on a street",
    title: "Nippon Paint Van Promotion",
    description: "A fully branded van taking Nippon Paint's message street to street.",
    location: "Raipur, C.G.",
    categories: ["Promotional Vans", "Outdoor Advertising"],
  },
  {
    image: "/images/work/digital-wall-painting.jpg",
    alt: "Muthoot Finance gold loan advertisement printed on a shop wall",
    title: "Muthoot Finance Wall Branding",
    description: "Large-format wall branding for a gold loan offer on a busy market road.",
    location: "Ambikapur, C.G.",
    categories: ["Wall Painting", "Outdoor Advertising"],
  },
  {
    image: "/images/work/led-screen-entrance.jpg",
    alt: "Free-standing LED screen showing a Maa Ad Agency advert inside a shopping mall",
    title: "Mall Entrance LED Display",
    description: "An LED screen placed where shoppers enter, so every visitor walks past it.",
    location: "Raipur City Center Mall",
    categories: ["LED"],
  },
  {
    image: "/images/work/promo-van-bike.jpg",
    alt: "Branded pickup van carrying a Bajaj motorcycle display outside a showroom",
    title: "Bajaj Two-Wheeler Van Promotion",
    description: "A mobile showroom van with a bike on display, promoting a local Bajaj dealer.",
    location: "Dhamtari, C.G.",
    categories: ["Promotional Vans", "Outdoor Advertising"],
  },
  {
    image: "/images/work/led-screen-foodcourt.jpg",
    alt: "Shopping mall food court with diners and an LED advertising screen in the background",
    title: "Food Court LED Display",
    description: "Screen placement in the food court, where visitors sit and stay longer.",
    location: "Raipur City Center Mall",
    categories: ["LED"],
  },
  {
    image: "/images/work/flex-printer-operator.jpg",
    alt: "Operator working at a large-format digital printer in a print studio",
    title: "Digital Wall Print Production",
    description: "Wall branding prints produced on large-format digital printers.",
    location: "Ambikapur, C.G.",
    categories: ["Print", "Wall Painting"],
  },
  {
    image: "/images/work/flex-printer.jpg",
    alt: "Large-format flex printer printing a colourful banner",
    title: "Large Format Flex Printing",
    description: "Flex printing for hoardings, banners and standees.",
    location: "Raipur, C.G.",
    categories: ["Print"],
  },
  {
    image: "/images/work/offset-press.jpg",
    alt: "Multi-colour offset printing press",
    title: "Offset Printing Production",
    description: "Offset print for brochures, pamphlets, calendars and stationery.",
    location: "Raipur, C.G.",
    categories: ["Print"],
  },
  {
    image: "/images/work/event-management.jpg",
    alt: "Event hall styled with white floral décor, long dining tables and a stage screen",
    title: "Event Design & Styling",
    description: "Venue décor, stage and seating planned and styled for an event.",
    categories: ["Events"],
  },
];

// Only categories that actually have work are offered as filters.
const categoryOrder: PortfolioCategory[] = [
  "Outdoor Advertising",
  "LED",
  "Promotional Vans",
  "Wall Painting",
  "Print",
  "Events",
];

export const portfolioFilters: ("All" | PortfolioCategory)[] = [
  "All",
  ...categoryOrder.filter((c) => portfolio.some((item) => item.categories.includes(c))),
];
