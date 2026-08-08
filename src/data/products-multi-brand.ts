import {
  ROAST_LEVELS,
  PROCESSES,
  ORIGINS,
  BREW_METHODS,
  FLAVOR_NOTES,
  COFFEE_TYPES,
  BODY_LEVELS,
  ACIDITY_LEVELS,
  SWEETNESS_LEVELS,
  SIZES,
  GRIND_OPTIONS,
  SPECIAL_TAGS,
} from "./coffee-brands";

export type Product = {
  id: number;
  name: string;
  brand: string;
  origin: string;
  country: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  badge: string;
  roast: (typeof ROAST_LEVELS)[number];
  process: (typeof PROCESSES)[number];
  originRegion: (typeof ORIGINS)[number];
  brewMethods: (typeof BREW_METHODS)[number][];
  grindTypes: (typeof GRIND_OPTIONS)[number][];
  image: string;
  imageAlt: string;
  description: string;
  tastingNotes: (typeof FLAVOR_NOTES)[number][];
  altitude: string;
  variety: string;
  notes: string;
  coffeeType: (typeof COFFEE_TYPES)[number];
  body: (typeof BODY_LEVELS)[number];
  acidity: (typeof ACIDITY_LEVELS)[number];
  sweetness: (typeof SWEETNESS_LEVELS)[number];
  size: (typeof SIZES)[number];
  specialTags: (typeof SPECIAL_TAGS)[number][];
  inStock: boolean;
  subscriptionEligible?: boolean;
  subscriptionSavings?: number;
};

interface ProductTemplate {
  name: string;
  origin: string;
  country: string;
  roast: (typeof ROAST_LEVELS)[number];
  coffeeType: (typeof COFFEE_TYPES)[number];
  brewMethods: string[];
  tastingNotes: string[];
  process: (typeof PROCESSES)[number];
  body: (typeof BODY_LEVELS)[number];
  acidity: (typeof ACIDITY_LEVELS)[number];
  sweetness: (typeof SWEETNESS_LEVELS)[number];
  price: number;
  subscriptionSavings: number;
}

const productTemplates: Record<string, ProductTemplate[]> = {
  starbucks: [
    { name: "Pike Place Roast", origin: "Global Blend", country: "USA Blend", roast: "Medium", coffeeType: "House Blend", brewMethods: ["Drip Coffee", "Pour Over", "Espresso"], tastingNotes: ["Cocoa", "Brown Sugar", "Caramel"], process: "Blend", body: "Medium", acidity: "Medium", sweetness: "Medium", price: 12.99, subscriptionSavings: 1.3 },
    { name: "Blonde Roast", origin: "Light Roast Blend", country: "USA Blend", roast: "Light", coffeeType: "Blend", brewMethods: ["Drip Coffee", "Pour Over"], tastingNotes: ["Citrus", "Vanilla", "Caramel"], process: "Blend", body: "Light", acidity: "Bright", sweetness: "Medium", price: 12.99, subscriptionSavings: 1.3 },
    { name: "Dark Roast", origin: "Full City Roast", country: "USA Blend", roast: "Dark", coffeeType: "Espresso Roast", brewMethods: ["Espresso", "Moka Pot", "French Press"], tastingNotes: ["Chocolate", "Cocoa", "Toffee"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Low", price: 12.99, subscriptionSavings: 1.3 },
    { name: "Kenya Single Origin", origin: "East African", country: "Kenya", roast: "Medium", coffeeType: "Single Origin", brewMethods: ["Pour Over", "Espresso"], tastingNotes: ["Berry", "Citrus", "Floral"], process: "Washed", body: "Medium", acidity: "Bright", sweetness: "Medium", price: 15.99, subscriptionSavings: 1.6 },
    { name: "Espresso Roast", origin: "Italian Style", country: "USA Blend", roast: "Dark", coffeeType: "Espresso Roast", brewMethods: ["Espresso", "Moka Pot"], tastingNotes: ["Chocolate", "Caramel", "Toffee"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Medium", price: 13.99, subscriptionSavings: 1.4 },
    { name: "Decaf Pike Place", origin: "Global Blend Decaf", country: "USA Blend", roast: "Medium", coffeeType: "Decaf", brewMethods: ["Drip Coffee", "Pour Over"], tastingNotes: ["Cocoa", "Caramel", "Brown Sugar"], process: "Blend", body: "Medium", acidity: "Medium", sweetness: "Medium", price: 13.99, subscriptionSavings: 1.4 },
  ],
  costa: [
    { name: "Costa Signature Blend", origin: "Signature Roast", country: "UK Blend", roast: "Medium", coffeeType: "House Blend", brewMethods: ["Drip Coffee", "Espresso", "Pour Over"], tastingNotes: ["Chocolate", "Cocoa", "Caramel"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Medium", price: 13.49, subscriptionSavings: 1.35 },
    { name: "Costa Bright Blend", origin: "Light Roast", country: "UK Blend", roast: "Light", coffeeType: "Blend", brewMethods: ["Pour Over", "Drip Coffee"], tastingNotes: ["Citrus", "Floral", "Vanilla"], process: "Blend", body: "Light", acidity: "Bright", sweetness: "Low", price: 13.49, subscriptionSavings: 1.35 },
    { name: "Costa Coffee Del Mar", origin: "South American Blend", country: "UK/Colombia Blend", roast: "Medium", coffeeType: "Blend", brewMethods: ["Espresso", "Moka Pot"], tastingNotes: ["Cocoa", "Nutty", "Caramel"], process: "Blend", body: "Medium", acidity: "Medium", sweetness: "Medium", price: 14.99, subscriptionSavings: 1.5 },
    { name: "Costa Mocha Blend", origin: "Ethiopian/Indonesian", country: "UK/Multi Blend", roast: "Dark", coffeeType: "Blend", brewMethods: ["Espresso", "French Press"], tastingNotes: ["Chocolate", "Cocoa", "Nutty"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Medium", price: 13.99, subscriptionSavings: 1.4 },
  ],
  dunkin: [
    { name: "Dunkin' Original Blend", origin: "Classic American Roast", country: "USA Blend", roast: "Medium", coffeeType: "House Blend", brewMethods: ["Drip Coffee", "Espresso"], tastingNotes: ["Cocoa", "Caramel", "Brown Sugar"], process: "Blend", body: "Medium", acidity: "Low", sweetness: "Medium", price: 11.99, subscriptionSavings: 1.2 },
    { name: "Dunkin' Espresso Blend", origin: "Strong Roast", country: "USA Blend", roast: "Dark", coffeeType: "Espresso Roast", brewMethods: ["Espresso", "Moka Pot"], tastingNotes: ["Chocolate", "Toffee", "Nutty"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Low", price: 12.99, subscriptionSavings: 1.3 },
    { name: "Dunkin' Light Roast", origin: "Bright & Smooth", country: "USA Blend", roast: "Light", coffeeType: "Blend", brewMethods: ["Drip Coffee", "Pour Over"], tastingNotes: ["Citrus", "Vanilla", "Brown Sugar"], process: "Blend", body: "Light", acidity: "Medium", sweetness: "Medium", price: 11.99, subscriptionSavings: 1.2 },
  ],
  mccafe: [
    { name: "McCafé Premium Roast", origin: "Smooth Blend", country: "USA Blend", roast: "Medium", coffeeType: "House Blend", brewMethods: ["Drip Coffee", "Espresso"], tastingNotes: ["Caramel", "Cocoa", "Brown Sugar"], process: "Blend", body: "Medium", acidity: "Low", sweetness: "Medium", price: 10.99, subscriptionSavings: 1.1 },
    { name: "McCafé Premium Roast Dark", origin: "Bold Roast", country: "USA Blend", roast: "Dark", coffeeType: "Espresso Roast", brewMethods: ["Espresso", "French Press"], tastingNotes: ["Chocolate", "Cocoa", "Toffee"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Low", price: 10.99, subscriptionSavings: 1.1 },
  ],
  "tim-hortons": [
    { name: "Tim Hortons Original Blend", origin: "Canadian Classic", country: "Canada Blend", roast: "Medium", coffeeType: "House Blend", brewMethods: ["Drip Coffee", "Pour Over"], tastingNotes: ["Cocoa", "Caramel", "Vanilla"], process: "Blend", body: "Medium", acidity: "Low", sweetness: "Medium", price: 11.49, subscriptionSavings: 1.15 },
    { name: "Tim Hortons Dark Roast", origin: "Bold Canadian Roast", country: "Canada Blend", roast: "Dark", coffeeType: "Blend", brewMethods: ["Drip Coffee", "Espresso"], tastingNotes: ["Chocolate", "Toffee", "Brown Sugar"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Low", price: 11.49, subscriptionSavings: 1.15 },
  ],
  "gloria-jeans": [
    { name: "Gloria Jean's Gourmet Espresso", origin: "Italian Inspired", country: "Australia/Italy Blend", roast: "Dark", coffeeType: "Espresso Roast", brewMethods: ["Espresso", "Moka Pot"], tastingNotes: ["Chocolate", "Cocoa", "Caramel"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Medium", price: 14.99, subscriptionSavings: 1.5 },
    { name: "Gloria Jean's Columbian Gold", origin: "Premium Colombian", country: "Australia/Colombia Blend", roast: "Medium", coffeeType: "Single Origin", brewMethods: ["Pour Over", "Drip Coffee"], tastingNotes: ["Chocolate", "Nutty", "Caramel"], process: "Washed", body: "Medium", acidity: "Medium", sweetness: "Medium", price: 15.99, subscriptionSavings: 1.6 },
    { name: "Gloria Jean's Ethiopian Dreams", origin: "East African", country: "Australia/Ethiopia Blend", roast: "Light", coffeeType: "Single Origin", brewMethods: ["Pour Over", "Espresso"], tastingNotes: ["Floral", "Citrus", "Honey"], process: "Washed", body: "Light", acidity: "Bright", sweetness: "Medium", price: 15.99, subscriptionSavings: 1.6 },
  ],
  jacobs: [
    { name: "Jacobs Kronung", origin: "German Premium Blend", country: "Germany Blend", roast: "Medium", coffeeType: "House Blend", brewMethods: ["Drip Coffee", "Pour Over", "Espresso"], tastingNotes: ["Cocoa", "Caramel", "Nutty"], process: "Blend", body: "Medium", acidity: "Low", sweetness: "Medium", price: 12.99, subscriptionSavings: 1.3 },
    { name: "Jacobs Expertenröstung", origin: "Expert's Roast", country: "Germany Blend", roast: "Dark", coffeeType: "Blend", brewMethods: ["Espresso", "French Press"], tastingNotes: ["Chocolate", "Cocoa", "Nutty"], process: "Blend", body: "Full", acidity: "Low", sweetness: "Low", price: 13.99, subscriptionSavings: 1.4 },
    { name: "Jacobs Mild Roast", origin: "Smooth German Blend", country: "Germany Blend", roast: "Light", coffeeType: "Blend", brewMethods: ["Drip Coffee", "Pour Over"], tastingNotes: ["Vanilla", "Brown Sugar", "Caramel"], process: "Blend", body: "Light", acidity: "Medium", sweetness: "Medium", price: 12.99, subscriptionSavings: 1.3 },
  ],
};

const getSeed = (brandIndex: number, templateIndex: number, variantIndex: number) => brandIndex * 100 + templateIndex * 10 + variantIndex;

const chooseDeterministic = <T,>(options: T[], seed: number) => options[seed % options.length];
const shouldIncludeTag = (seed: number, divisor: number) => seed % divisor === 0;

function selectBrandImage(brandKey: string, imageIndex: number) {
  const imageMap: Record<string, string[]> = {
    starbucks: [
      '/images/product/starbucks-1.png',
      '/images/product/starbucks-2.png',
    ],
    costa: ['/images/product/costa-1.png'],
    dunkin: ['/images/product/dunkin-1.png'],
    mccafe: ['/images/product/mccafe-1.png'],
    'gloria-jeans': [
      '/images/product/gloriajeans-1.png',
      '/images/product/gloriajeans-2.png',
      '/images/product/gloriajeans-3.png',
    ],
    jacobs: ['/images/product/jacobs-1.png'],
    'tim-hortons': ['/images/product/timhortons-1.png'],
  };

  const images = imageMap[brandKey] || ['/images/product/starbucks-1.png'];
  return images[imageIndex % images.length];
}

export const products: Product[] = [];
let productId = 1;

Object.entries(productTemplates).forEach(([brandKey, templates], brandIndex) => {
  templates.forEach((template, index) => {
    const variantCount = 2 + (index % 2);

    for (let v = 0; v < variantCount; v++) {
      const sizes: (typeof SIZES)[number][] = ["250g", "500g", "1kg", "Capsules"];
      const seed = getSeed(brandIndex, index, v);

      const grindTypes: (typeof GRIND_OPTIONS)[number][] = [];
      if (template.coffeeType === "Decaf") {
        grindTypes.push("Pre-Ground");
      } else {
        if (seed % 2 === 0) grindTypes.push("Whole Bean");
        if (seed % 3 === 0) grindTypes.push("Espresso Grind");
        if (seed % 4 === 0) grindTypes.push("Filter Grind");
        if (seed % 5 === 0) grindTypes.push("Pre-Ground");
      }
      if (grindTypes.length === 0) grindTypes.push("Whole Bean");

      const specialTags: (typeof SPECIAL_TAGS)[number][] = [];
      if (shouldIncludeTag(seed, 3)) specialTags.push("Best Seller");
      if (shouldIncludeTag(seed + 1, 4)) specialTags.push("New Arrival");
      if (shouldIncludeTag(seed + 2, 2)) specialTags.push("Subscription Eligible");
      if (shouldIncludeTag(seed + 3, 7)) specialTags.push("Limited Roast");

      const chosenSize = chooseDeterministic(sizes, seed);
      const priceMultiplier =
        chosenSize === "1kg"
          ? 3.5
          : chosenSize === "500g"
          ? 1.8
          : chosenSize === "Capsules"
          ? 2.2
          : 1;
      const finalPrice = Math.max(8, Math.round((template.price * priceMultiplier + v * 1.5) * 100) / 100);
      const rating = Math.round((4.3 + ((seed % 5) * 0.1)) * 10) / 10;
      const reviews = 20 + ((seed * 37) % 500);
      const inStock = seed % 7 !== 0;

      products.push({
        id: productId++,
        name: `${template.name}${v > 0 ? ` — Reserve ${v}` : ""}`,
        brand: brandKey,
        origin: template.origin,
        country: template.country,
        price: finalPrice,
        originalPrice: Math.round(finalPrice * 1.12 * 100) / 100,
        rating,
        reviews,
        altitude: "1200-1600m",
        variety: "Mixed Varieties",
        inStock,
        subscriptionEligible: specialTags.includes("Subscription Eligible"),
        subscriptionSavings: template.subscriptionSavings,
        image: selectBrandImage(brandKey, index + v),
        imageAlt: `${template.name} premium coffee`,
        badge: specialTags.includes("New Arrival")
          ? "New Arrival"
          : specialTags.includes("Best Seller")
          ? "Best Seller"
          : "Premium Selection",
        specialTags,
        size: chosenSize as (typeof SIZES)[number],
        grindTypes,
        process: template.process,
        originRegion: template.coffeeType === "House Blend" ? "Multi-Origin" : "Africa",
        brewMethods: template.brewMethods as (typeof BREW_METHODS)[number][],
        roast: template.roast,
        tastingNotes: template.tastingNotes as (typeof FLAVOR_NOTES)[number][],
        coffeeType: template.coffeeType,
        body: template.body,
        acidity: template.acidity,
        sweetness: template.sweetness,
        description: `Premium ${template.coffeeType.toLowerCase()} with ${template.tastingNotes
          .slice(0, 2)
          .join(" and ")} notes. Ideal for ${template.brewMethods[0]?.toLowerCase() || "coffee lovers"}.`,
        notes: `Smooth finish with ${template.body.toLowerCase()} body. Roast: ${template.roast}.`,
      });
    }
  });
});

export const reviews = [
  { id: 1, name: "Mina R.", rating: 5, title: "Elegant and complex", content: "The cup is vibrant and the delivery felt luxurious from start to finish.", verified: true },
  { id: 2, name: "Daniel T.", rating: 4, title: "Balanced and rich", content: "A beautiful daily roast that works in both my espresso and V60.", verified: true },
  { id: 3, name: "Sophie L.", rating: 5, title: "My favorite subscription", content: "The flavor profile is incredibly consistent and the packaging is gorgeous.", verified: true },
  { id: 4, name: "James K.", rating: 5, title: "Worth every penny", content: "Premium quality that rivals specialty roasters. Fast shipping too!", verified: true },
  { id: 5, name: "Elena M.", rating: 5, title: "Finally found my daily driver", content: "Smooth, reliable, and tastes consistent batch to batch.", verified: true },
];

export const quizSteps = [
  { id: 1, question: "How do you brew?", options: ["Espresso", "Drip", "French Press", "Cold Brew"] },
  { id: 2, question: "What flavors do you prefer?", options: ["Fruity/Floral", "Chocolatey/Nuts", "Bold/Smoky"] },
  { id: 3, question: "Do you add milk or sugar?", options: ["Yes", "No", "Sometimes"] },
];

export const quizResults = [
  { title: "Starbucks Blonde Roast", reason: "Balanced for espresso and milk drinks." },
  { title: "Costa Signature Blend", reason: "Bright and floral for lighter brews." },
  { title: "Dunkin' Espresso Blend", reason: "Bold and structured for darker roasts." },
];
