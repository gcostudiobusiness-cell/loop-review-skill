import { test } from "node:test";
import assert from "node:assert/strict";
import { createCart, addItem, subtotal, applyDiscount, total } from "../src/cart.js";

test("subtotal sums line items", () => {
  const cart = createCart();
  addItem(cart, { sku: "tea", price: 4, qty: 2 });
  addItem(cart, { sku: "mug", price: 10, qty: 1 });
  assert.equal(subtotal(cart), 18);
});

test("valid discount code is accepted", () => {
  const cart = createCart();
  assert.equal(applyDiscount(cart, "SAVE10"), true);
});

test("total includes tax", () => {
  const cart = createCart();
  addItem(cart, { sku: "mug", price: 10, qty: 1 });
  assert.equal(total(cart), 12);
});
