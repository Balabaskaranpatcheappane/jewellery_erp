export function inr(n: number): string {
  return n.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });
}

export function grams(n: number): string {
  return `${n.toLocaleString('en-IN', { minimumFractionDigits: 3 })} g`;
}
