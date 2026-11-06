/*
 * products.js: the single source of truth for the catalogue.
 * Used by the product page, the cart, the orders and the price calculations
 * (prices are ALWAYS recomputed from this file, never trusted from the cart).
 *
 * Shape of each product:
 *   id (SKU base), slug, name, category, badge, short, long, notes[], brewing{temp,time,amount,tip},
 *   origin, images[], variants[{ id (SKU), label, price (USD, no tax), inStock }]
 *
 * KL_DATA.seedVersion: bump this number and returning visitors re-seed their demo data on the next page load.
 */
window.KL_DATA = window.KL_DATA || {};
KL_DATA.seedVersion = 1;

KL_DATA.commerce = {
  currency: 'USD',
  maxQuantity: 10,
  freeShippingFrom: 40.00,    // Standard shipping is free when the cart subtotal is 40.00 or more
  shipping: { standard: 5.99, express: 12.00 },
  coupons: {
    CHAI10:   { label: '10% off',          type: 'percent', value: 10 },
    FIRSTCUP: { label: '$5 off over $30',  type: 'fixed',   value: 5, minSubtotal: 30 }
  }
};

KL_DATA.products = [
  {
    id: 'KL-DJ', slug: 'darjeeling-first-flush', name: 'Darjeeling First Flush', category: 'Black Tea', badge: 'Bestseller',
    short: 'A bright, floral spring harvest from the Himalayan foothills.',
    long: 'Plucked in the first weeks of spring, this Darjeeling is light in the cup and lively on the tongue. Hand-picked two leaves and a bud, withered gently and lightly oxidised so the muscatel sweetness stays front and centre. Brew it plain, and drink it slowly.',
    notes: ['Muscatel grape', 'Fresh-cut flowers', 'Light honey', 'Crisp, dry finish'],
    brewing: { temp: '90°C (195°F)', time: '3 minutes', amount: '1 heaped teaspoon per 200 ml', tip: 'Use water just off the boil. Boiling water will make it bitter.' },
    origin: 'Singell Estate, Darjeeling, West Bengal',
    images: ['img/darjeeling-1.svg', 'img/darjeeling-2.svg', 'img/darjeeling-3.svg'],
    variants: [
      { id: 'KL-DJ-050', label: '50g',  price: 9.00,  inStock: true },
      { id: 'KL-DJ-100', label: '100g', price: 16.00, inStock: true },
      { id: 'KL-DJ-250', label: '250g', price: 36.00, inStock: true }
    ]
  },
  {
    id: 'KL-AS', slug: 'assam-breakfast', name: 'Assam Breakfast', category: 'Black Tea', badge: '',
    short: 'A malty, full-bodied morning tea that stands up to milk.',
    long: 'Grown on the flat river plains of Upper Assam, this is the tea that wakes the house up. Rolled and fully oxidised for a deep amber cup with a rich, malty backbone. Loose leaf for the teapot, or tea bags when mornings are rushed.',
    notes: ['Malt', 'Dark toast', 'Raisin', 'Brisk and bold'],
    brewing: { temp: '98°C (208°F)', time: '4 minutes', amount: '1 teaspoon per 200 ml (or 1 tea bag)', tip: 'Add milk after brewing, not before.' },
    origin: 'Dikom Estate, Dibrugarh, Assam',
    images: ['img/assam-1.svg', 'img/assam-2.svg', 'img/assam-3.svg'],
    variants: [
      { id: 'KL-AS-100', label: 'Loose 100g',  price: 7.00,  inStock: true },
      { id: 'KL-AS-250', label: 'Loose 250g',  price: 15.00, inStock: true },
      { id: 'KL-AS-B25', label: '25 tea bags', price: 6.00,  inStock: true },
      { id: 'KL-AS-B50', label: '50 tea bags', price: 10.00, inStock: true }
    ]
  },
  {
    id: 'KL-NG', slug: 'nilgiri-green', name: 'Nilgiri Green', category: 'Green Tea', badge: 'New',
    short: 'Gentle, grassy and clean: an everyday green from the Blue Mountains.',
    long: 'High-altitude Nilgiri leaves, steamed briefly to keep their colour and freshness. Smooth and slightly sweet with none of the harshness green tea can have. Good hot, and very good cold-brewed overnight.',
    notes: ['Fresh grass', 'Green apple', 'Sweet pea', 'Soft mineral finish'],
    brewing: { temp: '80°C (175°F)', time: '2 minutes', amount: '1 teaspoon per 200 ml', tip: 'The leaves are happy to be brewed a second and third time.' },
    origin: 'Glendale Estate, Nilgiri Hills, Tamil Nadu',
    images: ['img/nilgiri-1.svg', 'img/nilgiri-2.svg', 'img/nilgiri-3.svg'],
    variants: [
      { id: 'KL-NG-050', label: '50g',  price: 8.00,  inStock: true },
      { id: 'KL-NG-100', label: '100g', price: 14.00, inStock: true }
    ]
  },
  {
    id: 'KL-MC', slug: 'masala-chai-blend', name: 'Masala Chai Blend', category: 'Chai', badge: '',
    short: 'Strong Assam with cardamom, ginger, cinnamon and black pepper.',
    long: 'Our house chai: robust Assam leaf blended with freshly cracked cardamom, dried ginger, cinnamon bark, clove and a little black pepper for warmth. Simmer it with milk the traditional way and sweeten to taste.',
    notes: ['Cardamom', 'Warm ginger', 'Cinnamon', 'Peppery finish'],
    brewing: { temp: 'Simmer', time: '5 minutes', amount: '2 teaspoons per 200 ml, half water and half milk', tip: 'Simmer the leaves in water first, then add milk and bring back to a gentle boil.' },
    origin: 'Blended and packed in Kolkata, West Bengal',
    images: ['img/masala-1.svg', 'img/masala-2.svg', 'img/masala-3.svg'],
    variants: [
      { id: 'KL-MC-100', label: '100g', price: 6.50,  inStock: true },
      { id: 'KL-MC-250', label: '250g', price: 13.00, inStock: true },
      { id: 'KL-MC-500', label: '500g', price: 24.00, inStock: false }   // out of stock on purpose
    ]
  }
];
