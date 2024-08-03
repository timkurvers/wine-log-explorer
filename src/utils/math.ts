// Mathematical modulo (as opposed to JavaScript's remainder operator)
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
export const mod = (a: number, m: number) => ((a % m) + m) % m
