// Coffee brand configuration for multi-brand shop
export type CoffeeBrand = {
  id: string;
  displayName: string;
  description: string;
  color: string;
  logo?: string;
};

export const COFFEE_BRANDS: CoffeeBrand[] = [
  {
    id: "costa",
    displayName: "Costa",
    description: "Globally loved British coffee brand",
    color: "#8B4513",
    logo: "/images/brands/costa-logo.png",
  },
  {
    id: "dunkin",
    displayName: "Dunkin",
    description: "America's favorite coffee destination",
    color: "#FF6600",
    logo: "/images/brands/dunkin-logo.png",
  },
  {
    id: "gloria-jeans",
    displayName: "Gloria Jean's",
    description: "Australian café culture classic",
    color: "#C41E3A",
    logo: "/images/brands/gloriajeans-logo.png",
  },
  {
    id: "jacobs",
    displayName: "Jacobs",
    description: "German precision and quality",
    color: "#8B6F47",
    logo: "/images/brands/jacobs-logo.png",
  },
  {
    id: "mccafe",
    displayName: "McCafé",
    description: "McDonald's premium coffee range",
    color: "#DA291C",
    logo: "/images/brands/mccafe-logo.png",
  },
  {
    id: "starbucks",
    displayName: "Starbucks",
    description: "The world's leading coffeehouse",
    color: "#00704A",
    logo: "/images/brands/starbucks-logo.png",
  },
  {
    id: "tim-hortons",
    displayName: "Tim Hortons",
    description: "Canadian coffee & donut iconic chain",
    color: "#C7102E",
    logo: "/images/brands/timhortons-logo.png",
  },
];

export const ROAST_LEVELS = ["Light", "Medium", "Dark"] as const;
export const PROCESSES = ["Washed", "Natural", "Honey", "Blend"] as const;
export const ORIGINS = ["Africa", "South America", "Central America", "Asia-Pacific", "Multi-Origin"] as const;
export const BREW_METHODS = ["Espresso", "Pour Over", "French Press", "Moka Pot", "Cold Brew", "Drip Coffee"] as const;
export const FLAVOR_NOTES = [
  "Chocolate",
  "Citrus",
  "Floral",
  "Nutty",
  "Berry",
  "Caramel",
  "Cocoa",
  "Toffee",
  "Vanilla",
  "Brown Sugar",
] as const;
export const COFFEE_TYPES = ["Single Origin", "Blend", "Decaf", "Espresso Roast", "House Blend"] as const;
export const BODY_LEVELS = ["Light", "Medium", "Full"] as const;
export const ACIDITY_LEVELS = ["Low", "Medium", "Bright"] as const;
export const SWEETNESS_LEVELS = ["Low", "Medium", "High"] as const;
export const SIZES = ["250g", "500g", "1kg", "Capsules", "Ground Pack", "Whole Bean Bag"] as const;
export const GRIND_OPTIONS = ["Whole Bean", "Espresso Grind", "Filter Grind", "French Press Grind", "Pre-Ground"] as const;
export const SPECIAL_TAGS = ["Best Seller", "New Arrival", "Subscription Eligible", "Limited Roast", "Seasonal"] as const;
