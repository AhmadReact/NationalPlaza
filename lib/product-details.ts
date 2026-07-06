import type { Product } from "./data";

export interface DetailContent {
  intro: string[];
  features: string[];
  specs: [string, string][];
}

function tonnage(name: string): string {
  const match = name.match(/(\d(?:\.\d)?)\s*Ton/i);
  return match ? `${match[1]} Ton` : "1.5 Ton";
}

function screenSize(name: string): string {
  const match = name.match(/(\d{2})"/);
  return match ? `${match[1]} inches` : "43 inches";
}

export function getDetailContent(product: Product): DetailContent {
  const { brand, name, art } = product;

  switch (art) {
    case "ac":
      return {
        intro: [
          `Meet the ${name} — a DC inverter split air conditioner engineered for Pakistan's toughest summers. Its full inverter compressor continuously adjusts cooling output instead of switching on and off, cutting electricity consumption by up to 60% compared to conventional units.`,
          `With rapid turbo cooling, low-voltage startup that works even on unstable grids and UPS/solar compatibility, the ${brand} keeps your room comfortable through load-shedding season. The anti-rust outdoor unit is built for T3 tropical climates, so performance holds up even at 55°C.`,
        ],
        features: [
          "Full DC inverter — up to 60% energy savings",
          "Turbo cooling reaches set temperature faster",
          "Low-voltage startup (works from 150V)",
          "UPS & solar compatible",
          "4-way auto swing air throw",
          "Self-cleaning & anti-fungus evaporator",
        ],
        specs: [
          ["Brand", brand],
          ["Capacity", tonnage(name)],
          ["Type", "DC Inverter Split AC"],
          ["Function", "Heat & Cool"],
          ["Compressor", "T3 Tropical, Full Inverter"],
          ["Refrigerant", "R410a (eco-friendly)"],
          ["Energy Efficiency", "A+++ Class"],
          ["Voltage", "220V / 50Hz"],
          ["Warranty", "10 Years Compressor, 1 Year Parts"],
        ],
      };
    case "fridge":
      return {
        intro: [
          `The ${name} brings dependable, frost-free freshness to your kitchen. Its inverter compressor adapts to the load inside, keeping vegetables crisp and dairy fresh for longer while consuming a fraction of the electricity of a conventional refrigerator.`,
          `A wide-climate design keeps cooling stable even in extreme heat, and up to 8 hours of cooling retention protects your food through load-shedding. Adjustable tempered-glass shelves, a spacious freezer and LED interior lighting complete a package built for Pakistani households.`,
        ],
        features: [
          "Inverter compressor — up to 50% energy savings",
          "8-hour cooling retention during power cuts",
          "Wide climate class (works up to 55°C)",
          "Adjustable tempered-glass shelving",
          "Separate crisper zone for fruits & vegetables",
          "Door-open alarm & LED interior lighting",
        ],
        specs: [
          ["Brand", brand],
          ["Cooling Technology", "Inverter, Frost-Free"],
          ["Climate Class", "T (Tropical)"],
          ["Energy Class", "A+"],
          ["Shelves", "Tempered Glass, Adjustable"],
          ["Defrost", "Automatic"],
          ["Voltage", "220V / 50-60Hz"],
          ["Warranty", "12 Years Compressor"],
        ],
      };
    case "cooler":
      return {
        intro: [
          `The ${name} delivers powerful, whisper-quiet cooling at a fraction of the running cost of an air conditioner. Its high-airflow fan pulls air through honeycomb cooling pads and a dedicated ice-box compartment, dropping room temperature fast.`,
          `A large water tank gives hours of uninterrupted cooling, while the low-wattage motor keeps it light on your electricity bill — many models can even run directly on UPS or solar. Castor wheels make it easy to move from room to room.`,
        ],
        features: [
          "Ice-box compartment for extra chill",
          "High-density honeycomb cooling pads",
          "Large water tank — up to 12 hours runtime",
          "Low power consumption (UPS/solar friendly)",
          "3-speed motor with wide air throw",
          "Castor wheels for easy mobility",
        ],
        specs: [
          ["Brand", brand],
          ["Type", "Room Air Cooler"],
          ["Cooling Pads", "Honeycomb"],
          ["Tank Capacity", "40–60 Litres"],
          ["Ice Box", "Yes"],
          ["Speed Settings", "3 Speed"],
          ["Power Consumption", "Approx. 220W"],
          ["Voltage", "220V / 50Hz"],
          ["Warranty", "1 Year Motor"],
        ],
      };
    case "tv":
    default:
      return {
        intro: [
          `Bring the cinema home with the ${name}. A bright, high-contrast panel with vivid colour reproduction turns movies, cricket and gaming into an immersive experience, while the built-in smart platform puts YouTube, Netflix and hundreds of apps one tap away.`,
          `Voice search from the remote, screen casting from your phone, and multiple HDMI/USB ports make it the hub of your living room. An official brand warranty and nationwide service network back every purchase.`,
        ],
        features: [
          "4K-ready panel with vivid colour engine",
          "Smart OS with Netflix, YouTube & app store",
          "Built-in Chromecast / screen mirroring",
          "Voice search remote control",
          "Dolby Audio with surround effect",
          "Multiple HDMI & USB ports",
        ],
        specs: [
          ["Brand", brand],
          ["Screen Size", screenSize(name)],
          ["Display", "LED, 4K UHD"],
          ["Smart Platform", "Android / Google TV"],
          ["Sound", "Dolby Audio, 2 x 10W"],
          ["Connectivity", "Wi-Fi, Bluetooth, 3x HDMI, 2x USB"],
          ["Voltage", "100–240V"],
          ["Warranty", "2 Years Official"],
        ],
      };
  }
}
