export type Product = {
  id: number;
  name: string;
  origin: string;
  country: string;
  price: number;
  rating: number;
  reviews: number;
  badge: string;
  roast: 'Light' | 'Medium' | 'Dark';
  process: 'Washed' | 'Natural' | 'Honey';
  originRegion: 'Africa' | 'South America' | 'Asia-Pacific';
  grindTypes: string[];
  image: string;
  imageAlt: string;
  description: string;
  tastingNotes: string[];
  altitude: string;
  variety: string;
  notes: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: 'Ethiopia Yirgacheffe',
    origin: 'Highland Bloom',
    country: 'Ethiopia',
    price: 24,
    rating: 4.9,
    reviews: 312,
    badge: 'Single Origin',
    roast: 'Light',
    process: 'Washed',
    originRegion: 'Africa',
    grindTypes: ['Whole Bean', 'Filter', 'Espresso'],
    image: '/images/product/starbucks-1.png',
    imageAlt: 'A premium Ethiopian coffee bag',
    description: 'Floral, citrus, and honeyed with a silky finish.',
    tastingNotes: ['Bergamot', 'Honey', 'Jasmine'],
    altitude: '1800m',
    variety: 'Geisha',
    notes: 'Best brewed with a pour-over for clarity.',
  },
  {
    id: 2,
    name: 'Colombia Reserva',
    origin: 'Andean Velvet',
    country: 'Colombia',
    price: 18,
    rating: 4.8,
    reviews: 228,
    badge: 'Best Seller',
    roast: 'Medium',
    process: 'Honey',
    originRegion: 'South America',
    grindTypes: ['Whole Bean', 'Drip', 'French Press'],
    image: '/images/product/costa-1.png',
    imageAlt: 'A premium Colombian coffee bag',
    description: 'Caramel, cocoa, and stone fruit in a balanced cup.',
    tastingNotes: ['Caramel', 'Cocoa', 'Apricot'],
    altitude: '1600m',
    variety: 'Caturra',
    notes: 'Ideal for drip and daily espresso.',
  },
  {
    id: 3,
    name: 'Sumatra Mandheling',
    origin: 'Rainforest Reserve',
    country: 'Indonesia',
    price: 22,
    rating: 4.7,
    reviews: 176,
    badge: 'New Arrival',
    roast: 'Dark',
    process: 'Natural',
    originRegion: 'Asia-Pacific',
    grindTypes: ['Whole Bean', 'Espresso', 'French Press'],
    image: '/images/product/gloriajeans-1.png',
    imageAlt: 'A premium Sumatra coffee bag',
    description: 'Deep, earthy, and rich with dried fruit complexity.',
    tastingNotes: ['Cocoa', 'Blackberry', 'Spice'],
    altitude: '1200m',
    variety: 'Sigarar Utang',
    notes: 'Built for bold brews and milk-based drinks.',
  },
  {
    id: 4,
    name: 'Velvet House Blend',
    origin: 'Signature Roast',
    country: 'Blended',
    price: 20,
    rating: 4.9,
    reviews: 410,
    badge: 'Fan Favorite',
    roast: 'Medium',
    process: 'Washed',
    originRegion: 'South America',
    grindTypes: ['Whole Bean', 'Drip', 'Espresso'],
    image: '/images/product/jacobs-1.png',
    imageAlt: 'A premium house blend coffee bag',
    description: 'Creamy texture with chocolate and orange blossom.',
    tastingNotes: ['Chocolate', 'Orange Blossom', 'Toffee'],
    altitude: '1400m',
    variety: 'Blend',
    notes: 'A supple daily drinker for all brewers.',
  },
];

export const reviews = [
  {
    id: 1,
    name: 'Mina R.',
    rating: 5,
    title: 'Elegant and complex',
    content:
      'The cup is vibrant and the delivery felt luxurious from start to finish.',
    verified: true,
  },
  {
    id: 2,
    name: 'Daniel T.',
    rating: 4,
    title: 'Balanced and rich',
    content: 'A beautiful daily roast that works in both my espresso and V60.',
    verified: true,
  },
  {
    id: 3,
    name: 'Sophie L.',
    rating: 5,
    title: 'My favorite subscription',
    content:
      'The flavor profile is incredibly consistent and the packaging is gorgeous.',
    verified: true,
  },
];

export const quizSteps = [
  {
    id: 1,
    question: 'How do you brew?',
    options: ['Espresso', 'Drip', 'French Press', 'Cold Brew'],
  },
  {
    id: 2,
    question: 'What flavors do you prefer?',
    options: ['Fruity/Floral', 'Chocolatey/Nuts', 'Bold/Smoky'],
  },
  {
    id: 3,
    question: 'Do you add milk or sugar?',
    options: ['Yes', 'No', 'Sometimes'],
  },
];

export const quizResults = [
  {
    title: 'Velvet House Blend',
    reason: 'Balanced for espresso and milk drinks.',
  },
  {
    title: 'Ethiopia Yirgacheffe',
    reason: 'Bright and floral for lighter brews.',
  },
  {
    title: 'Sumatra Mandheling',
    reason: 'Bold and structured for darker roasts.',
  },
];
