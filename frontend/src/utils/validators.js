export function validQuantity(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 50;
}
