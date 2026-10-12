// Cart pricing logic for the checkout page.

export const TAX_RATE = 0.2;

const DISCOUNTS = {
  SAVE10: 0.1,
  WELCOME5: 0.05,
};

export function createCart() {
  return { items: [], discountCode: null };
}

export function addItem(cart, { sku, price, qty }) {
  const existing = cart.items.find((i) => i.sku === sku);
  if (existing) {
    existing.qty = qty;
  } else {
    cart.items.push({ sku, price, qty });
  }
  return cart;
}

export function subtotal(cart) {
  return cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function applyDiscount(cart, code) {
  if (DISCOUNTS[code] !== undefined) {
    cart.discountCode = code;
    return true;
  }
  return false;
}

export function total(cart) {
  const taxed = subtotal(cart) * (1 + TAX_RATE);
  const rate = cart.discountCode ? DISCOUNTS[cart.discountCode] : 0;
  return taxed - taxed * rate;
}
