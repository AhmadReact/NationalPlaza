import type { Product } from "./data";

export interface DetailContent {
  intro: string[];
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
      };
    case "fridge":
      return {
        intro: [
          `The ${name} brings dependable, frost-free freshness to your kitchen. Its inverter compressor adapts to the load inside, keeping vegetables crisp and dairy fresh for longer while consuming a fraction of the electricity of a conventional refrigerator.`,
          `A wide-climate design keeps cooling stable even in extreme heat, and up to 8 hours of cooling retention protects your food through load-shedding. Adjustable tempered-glass shelves, a spacious freezer and LED interior lighting complete a package built for Pakistani households.`,
        ],
      };
    case "cooler":
      return {
        intro: [
          `The ${name} delivers powerful, whisper-quiet cooling at a fraction of the running cost of an air conditioner. Its high-airflow fan pulls air through honeycomb cooling pads and a dedicated ice-box compartment, dropping room temperature fast.`,
          `A large water tank gives hours of uninterrupted cooling, while the low-wattage motor keeps it light on your electricity bill — many models can even run directly on UPS or solar. Castor wheels make it easy to move from room to room.`,
        ],
      };
    case "tv":
    default:
      return {
        intro: [
          `Bring the cinema home with the ${name}. A bright, high-contrast panel with vivid colour reproduction turns movies, cricket and gaming into an immersive experience, while the built-in smart platform puts YouTube, Netflix and hundreds of apps one tap away.`,
          `Voice search from the remote, screen casting from your phone, and multiple HDMI/USB ports make it the hub of your living room. An official brand warranty and nationwide service network back every purchase.`,
        ],
      };
  }
}
