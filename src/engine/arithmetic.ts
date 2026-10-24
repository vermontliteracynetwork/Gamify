// Evaluates "12 + 3 × 4" style input for the calculator tool, with normal
// order of operations. Returns null for anything it can't read.
export function evaluate(input: string): number | null {
  const tokens = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').match(/\d+(\.\d+)?|[+\-*/]/g);
  if (!tokens || tokens.join('') !== input.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')) return null;
  const nums: number[] = [];
  const ops: string[] = [];
  let expectNumber = true;
  for (const tok of tokens) {
    if (expectNumber) {
      if (!/\d/.test(tok)) return null;
      nums.push(parseFloat(tok));
    } else {
      if (/\d/.test(tok)) return null;
      ops.push(tok);
    }
    expectNumber = !expectNumber;
  }
  if (expectNumber) return null; // ends with an operator
  // First pass: * and /.
  const n2 = [nums[0]];
  const o2: string[] = [];
  ops.forEach((op, i) => {
    const next = nums[i + 1];
    if (op === '*') n2[n2.length - 1] *= next;
    else if (op === '/') n2[n2.length - 1] /= next;
    else { o2.push(op); n2.push(next); }
  });
  const result = o2.reduce((acc, op, i) => (op === '+' ? acc + n2[i + 1] : acc - n2[i + 1]), n2[0]);
  return Number.isFinite(result) ? Math.round(result * 1e6) / 1e6 : null;
}
