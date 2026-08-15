export type ArtKind =
  | "ac"
  | "fridge"
  | "cooler"
  | "tv"
  | "washing"
  | "freezer"
  | "fan"
  | "microwave"
  | "dispenser"
  | "airfryer"
  | "hob"
  | "hood"
  | "oven";

export interface Product {
  id: string;
  /** UUID used by cart APIs (falls back to id when absent). */
  productId?: string;
  /** URL slug when different from id. */
  slug?: string;
  brand: string;
  name: string;
  /** undefined means "Inquire for price" */
  price?: number;
  oldPrice?: number;
  reviews: number;
  rating: number;
  art: ArtKind;
  tint: string; // tailwind gradient classes for the card image area
  badge?: string;
  /** Optional real product image from API */
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
  art: ArtKind;
}

export interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  highlight: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
  art: ArtKind;
  stat: { value: string; label: string };
}

export interface Testimonial {
  name: string;
  title: string;
  quote: string;
  date: string;
}

export function formatPrice(value: number): string {
  return "Rs." + value.toLocaleString("en-US");
}

export const categories: Category[] = [
  { id: "air-conditioners", name: "Air Conditioners", count: 267, art: "ac" },
  { id: "refrigerators", name: "Refrigerators", count: 261, art: "fridge" },
  { id: "led-tvs", name: "LED TVs", count: 129, art: "tv" },
  { id: "washing-machines", name: "Washing Machines", count: 103, art: "washing" },
  { id: "kitchen-appliances", name: "Kitchen Appliances", count: 97, art: "microwave" },
  { id: "deep-freezers", name: "Deep Freezers", count: 52, art: "freezer" },
  { id: "water-dispensers", name: "Water Dispensers", count: 43, art: "dispenser" },
  { id: "kitchen-hobs", name: "Kitchen Hobs", count: 40, art: "hob" },
  { id: "air-fryers", name: "Air Fryers", count: 37, art: "airfryer" },
  { id: "air-coolers", name: "Air Coolers", count: 33, art: "cooler" },
  { id: "kitchen-hoods", name: "Kitchen Hoods", count: 28, art: "hood" },
  { id: "built-in-ovens", name: "Built-in Ovens", count: 21, art: "oven" },
];

export const heroSlides: HeroSlide[] = [
  {
    id: "summer-sale",
    kicker: "Grand Summer Sale",
    title: "Inverter ACs at",
    highlight: "Up to 30% Off",
    subtitle:
      "DC inverter split ACs from Haier, Gree, TCL & Kenwood — cut your bills, not your comfort.",
    cta: "Shop Air Conditioners",
    href: "#air-conditioners",
    gradient: "from-brand-950 via-brand-900 to-brand-700",
    art: "ac",
    stat: { value: "30%", label: "Max Discount" },
  },
  {
    id: "beat-the-heat",
    kicker: "Beat the Heat",
    title: "Room Air Coolers",
    highlight: "From Rs.24,500",
    subtitle:
      "Super Asia, Royal & Canon coolers with ice-box technology. Big airflow, tiny power bill.",
    cta: "Shop Air Coolers",
    href: "#air-coolers",
    gradient: "from-teal-950 via-teal-900 to-cyan-700",
    art: "cooler",
    stat: { value: "12hr", label: "Cooling Runtime" },
  },
  {
    id: "fresh-deals",
    kicker: "Fresh Deals Week",
    title: "Refrigerators with",
    highlight: "Free Delivery",
    subtitle:
      "Dawlance, Haier, PEL & Homage inverter refrigerators — delivered anywhere in Pakistan.",
    cta: "Shop Refrigerators",
    href: "#refrigerators",
    gradient: "from-emerald-950 via-emerald-900 to-emerald-700",
    art: "fridge",
    stat: { value: "0km", label: "Delivery Charges" },
  },
  {
    id: "cinema-home",
    kicker: "Cinema at Home",
    title: "4K Smart LED TVs",
    highlight: "Starting Rs.49,900",
    subtitle:
      "Android & Google TV from Samsung, TCL and Haier with 2-year official warranty.",
    cta: "Shop LED TVs",
    href: "#led-tvs",
    gradient: "from-indigo-950 via-violet-900 to-purple-700",
    art: "tv",
    stat: { value: "2yr", label: "Official Warranty" },
  },
];

export const airConditioners: Product[] = [
  {
    id: "ac-1",
    brand: "Kenwood",
    name: "Kenwood Split AC Inverter 1.5 Ton KES-1873S eSmart Plus",
    price: 128000,
    oldPrice: 172700,
    reviews: 12,
    rating: 5,
    art: "ac",
    tint: "from-sky-100 to-blue-50",
    badge: "Best Seller",
  },
  {
    id: "ac-2",
    brand: "Hisense",
    name: "Hisense Split AC Inverter 1.0 Ton 12TV60HC T3",
    price: 110000,
    oldPrice: 143700,
    reviews: 8,
    rating: 4.5,
    art: "ac",
    tint: "from-cyan-100 to-sky-50",
  },
  {
    id: "ac-3",
    brand: "Haier",
    name: "Haier AC Split Inverter 1.5 Ton HSU-19RFP (White)",
    price: 125000,
    oldPrice: 138500,
    reviews: 5,
    rating: 4.5,
    art: "ac",
    tint: "from-blue-100 to-indigo-50",
  },
  {
    id: "ac-4",
    brand: "Gree",
    name: "Gree Split AC Inverter 1.5 Ton GS-18PITH11W Pular",
    price: 146500,
    oldPrice: 168000,
    reviews: 17,
    rating: 5,
    art: "ac",
    tint: "from-slate-100 to-sky-50",
    badge: "Top Rated",
  },
  {
    id: "ac-5",
    brand: "Orient",
    name: "Orient Split AC Inverter 1.5 Ton 18X Pro (Ultra Silver)",
    price: 124900,
    oldPrice: 141600,
    reviews: 4,
    rating: 4,
    art: "ac",
    tint: "from-zinc-100 to-slate-50",
  },
  {
    id: "ac-6",
    brand: "TCL",
    name: "TCL 1.0 Ton SaveIn Inverter AC TAC-12SVN-AI-11",
    price: 99900,
    oldPrice: 124700,
    reviews: 9,
    rating: 4.5,
    art: "ac",
    tint: "from-sky-100 to-cyan-50",
    badge: "Hot Deal",
  },
  {
    id: "ac-7",
    brand: "Midea",
    name: "Midea Split AC Inverter 1.5 Ton (18-HRFN) Extreme",
    reviews: 6,
    rating: 4.5,
    art: "ac",
    tint: "from-indigo-100 to-blue-50",
  },
  {
    id: "ac-8",
    brand: "Haier",
    name: "Haier Split AC Inverter 1.0 Ton HSU-13HFCS023DC (White)",
    price: 110000,
    oldPrice: 118500,
    reviews: 3,
    rating: 4,
    art: "ac",
    tint: "from-blue-100 to-sky-50",
  },
];

export const refrigerators: Product[] = [
  {
    id: "ref-1",
    brand: "Dawlance",
    name: "Dawlance REF 9173 WB IceMax Midnight Blue",
    price: 92000,
    oldPrice: 100000,
    reviews: 11,
    rating: 5,
    art: "fridge",
    tint: "from-blue-100 to-indigo-50",
    badge: "Best Seller",
  },
  {
    id: "ref-2",
    brand: "Haier",
    name: "Haier SBS Refrigerator HRF-578TSG (Silver)",
    price: 210000,
    oldPrice: 227400,
    reviews: 7,
    rating: 5,
    art: "fridge",
    tint: "from-slate-100 to-zinc-50",
    badge: "Premium",
  },
  {
    id: "ref-3",
    brand: "PEL",
    name: "PEL PRLP-1400 SD Life Pro Brushed Metallic Grey",
    price: 51500,
    oldPrice: 54300,
    reviews: 5,
    rating: 4,
    art: "fridge",
    tint: "from-zinc-100 to-stone-50",
  },
  {
    id: "ref-4",
    brand: "Homage",
    name: "Homage HRI-47662/480 Crystal Inverter Mirror",
    price: 130200,
    oldPrice: 137100,
    reviews: 4,
    rating: 4.5,
    art: "fridge",
    tint: "from-emerald-100 to-teal-50",
  },
  {
    id: "ref-5",
    brand: "Dawlance",
    name: "Dawlance REF 9173 Digital Pro Magnetic Red",
    price: 98000,
    oldPrice: 107900,
    reviews: 9,
    rating: 4.5,
    art: "fridge",
    tint: "from-rose-100 to-red-50",
    badge: "Hot Deal",
  },
  {
    id: "ref-6",
    brand: "Homage",
    name: "Homage HR-47782/-L (GD) Tech Inverter MRG (R-550)",
    price: 140900,
    oldPrice: 148400,
    reviews: 2,
    rating: 4,
    art: "fridge",
    tint: "from-amber-100 to-yellow-50",
  },
  {
    id: "ref-7",
    brand: "Haier",
    name: "Haier Inverter Refrigerator HRF-398 IFPA Digital",
    price: 118500,
    oldPrice: 126900,
    reviews: 13,
    rating: 5,
    art: "fridge",
    tint: "from-cyan-100 to-sky-50",
    badge: "Top Rated",
  },
  {
    id: "ref-8",
    brand: "Homage",
    name: "Homage HRI-47552/400 Crystal Inverter Mirror",
    price: 121400,
    oldPrice: 127800,
    reviews: 3,
    rating: 4.5,
    art: "fridge",
    tint: "from-violet-100 to-purple-50",
  },
];

export const airCoolers: Product[] = [
  {
    id: "cool-1",
    brand: "Super Asia",
    name: "Super Asia Room Air Cooler ECM-5500 Plus",
    price: 33400,
    oldPrice: 35200,
    reviews: 21,
    rating: 5,
    art: "cooler",
    tint: "from-teal-100 to-emerald-50",
    badge: "Best Seller",
  },
  {
    id: "cool-2",
    brand: "Royal Fans",
    name: "Royal Room Cooler RAC-5700 (White Grey)",
    price: 34400,
    oldPrice: 36300,
    reviews: 6,
    rating: 4.5,
    art: "cooler",
    tint: "from-sky-100 to-cyan-50",
  },
  {
    id: "cool-3",
    brand: "Cherry",
    name: "Cherry Room Air Cooler CR-4200 AC",
    price: 24500,
    oldPrice: 25800,
    reviews: 4,
    rating: 4,
    art: "cooler",
    tint: "from-rose-100 to-pink-50",
    badge: "Lowest Price",
  },
  {
    id: "cool-4",
    brand: "Nasgas",
    name: "Nasgas Room Air Cooler NAC-9824",
    price: 31500,
    oldPrice: 33200,
    reviews: 7,
    rating: 4.5,
    art: "cooler",
    tint: "from-lime-100 to-green-50",
  },
  {
    id: "cool-5",
    brand: "Canon",
    name: "Canon Room Air Cooler CA-6500 (Grey)",
    price: 34800,
    oldPrice: 36700,
    reviews: 10,
    rating: 4.5,
    art: "cooler",
    tint: "from-slate-100 to-zinc-50",
  },
  {
    id: "cool-6",
    brand: "Super Asia",
    name: "Super Asia Room Air Cooler ECM-4700 Plus (Inverter)",
    price: 36200,
    oldPrice: 38200,
    reviews: 5,
    rating: 4.5,
    art: "cooler",
    tint: "from-emerald-100 to-teal-50",
    badge: "Inverter",
  },
  {
    id: "cool-7",
    brand: "Beetro",
    name: "Beetro Room Air Cooler Y-100C",
    price: 47000,
    oldPrice: 49500,
    reviews: 8,
    rating: 5,
    art: "cooler",
    tint: "from-cyan-100 to-blue-50",
  },
  {
    id: "cool-8",
    brand: "Royal Fans",
    name: "Royal Room Cooler RAC-4700 DC (Solar Compatible)",
    price: 24800,
    oldPrice: 26200,
    reviews: 3,
    rating: 4,
    art: "cooler",
    tint: "from-amber-100 to-orange-50",
    badge: "Solar",
  },
];

export const ledTvs: Product[] = [
  {
    id: "tv-1",
    brand: "TCL",
    name: "TCL 55\" QLED 4K Google TV C655 Pro",
    price: 164900,
    oldPrice: 189000,
    reviews: 14,
    rating: 5,
    art: "tv",
    tint: "from-violet-100 to-indigo-50",
    badge: "Top Rated",
  },
  {
    id: "tv-2",
    brand: "Haier",
    name: "Haier 43\" Smart Android LED H43K800FX",
    price: 79500,
    oldPrice: 92000,
    reviews: 9,
    rating: 4.5,
    art: "tv",
    tint: "from-indigo-100 to-blue-50",
  },
  {
    id: "tv-3",
    brand: "Samsung",
    name: "Samsung 55\" Crystal UHD 4K Smart TV CU7000",
    price: 195000,
    oldPrice: 215000,
    reviews: 18,
    rating: 5,
    art: "tv",
    tint: "from-slate-100 to-gray-50",
    badge: "Premium",
  },
  {
    id: "tv-4",
    brand: "Hisense",
    name: "Hisense 40\" Full HD Smart VIDAA TV 40A4K",
    price: 49900,
    oldPrice: 58500,
    reviews: 6,
    rating: 4.5,
    art: "tv",
    tint: "from-blue-100 to-cyan-50",
    badge: "Hot Deal",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Muhammad Irfan",
    title: "Honest dealing, no hidden charges",
    quote:
      "I purchased a Dawlance dishwasher from National Electronics and had a great experience. The price quoted was exactly the final price — honest, respectful and professional dealing throughout.",
    date: "Jul 2026",
  },
  {
    name: "Umair Khan",
    title: "Guided me to the right product",
    quote:
      "The sales team guided me very well, offered the right product for my budget, and responded on time. Highly recommended for anyone buying appliances.",
    date: "Jul 2026",
  },
  {
    name: "Irum Bukhari",
    title: "This smart AC is a lifesaver",
    quote:
      "Brilliant service — the inverter AC they recommended keeps my bills low and my room freezing. Delivery and installation were both on schedule.",
    date: "Jun 2026",
  },
  {
    name: "Syed Shabir Hussain",
    title: "Affordable prices, great staff",
    quote:
      "I really liked the way National Electronics dealt with us. We bought a Gree inverter AC and the price was genuinely affordable compared to the market.",
    date: "Jun 2026",
  },
  {
    name: "Ilyas Ahmed",
    title: "Accurate information every time",
    quote:
      "Very helpful and well-mannered sales team. They provide accurate specs and honest comparisons instead of just pushing the expensive option.",
    date: "May 2026",
  },
  {
    name: "Faizan Malik",
    title: "Smooth buying experience",
    quote:
      "From the first WhatsApp message to delivery at my doorstep in Lahore, everything was smooth. 80 years of business shows in how they operate.",
    date: "May 2026",
  },
];

export const productGroups: {
  id: string;
  name: string;
  products: Product[];
}[] = [
  { id: "air-conditioners", name: "Air Conditioners", products: airConditioners },
  { id: "refrigerators", name: "Refrigerators", products: refrigerators },
  { id: "air-coolers", name: "Air Coolers", products: airCoolers },
  { id: "led-tvs", name: "LED TVs", products: ledTvs },
];

export interface ProductLookup {
  product: Product;
  categoryId: string;
  categoryName: string;
  related: Product[];
}

export function getProductById(id: string): ProductLookup | undefined {
  for (const group of productGroups) {
    const product = group.products.find((p) => p.id === id);
    if (product) {
      return {
        product,
        categoryId: group.id,
        categoryName: group.name,
        related: group.products.filter((p) => p.id !== id).slice(0, 4),
      };
    }
  }
  return undefined;
}

export function getAllProducts(): Product[] {
  return productGroups.flatMap((group) => group.products);
}

export const brands = [
  "Haier",
  "Dawlance",
  "Samsung",
  "Gree",
  "TCL",
  "Kenwood",
  "PEL",
  "Orient",
  "Homage",
  "Hisense",
  "Super Asia",
  "Midea",
];
