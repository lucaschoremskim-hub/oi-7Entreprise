export const TVA_RATES = [20, 10, 5.5, 0]

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export const toNumber = num

// Total HT d'une ligne après remise de ligne
export function lineTotal(line) {
  const base = num(line.qty) * num(line.price)
  const disc = Math.min(Math.max(num(line.discount), 0), 100)
  return round2(base * (1 - disc / 100))
}

// Totaux d'un document : remise par ligne, remise globale, TVA par taux
export function computeTotals(doc) {
  const lines = doc.lines || []
  const subtotal = round2(lines.reduce((s, l) => s + lineTotal(l), 0))

  const dv = Math.max(num(doc.discountValue), 0)
  let discount = doc.discountType === 'amount' ? dv : (subtotal * Math.min(dv, 100)) / 100
  discount = round2(Math.min(discount, subtotal))

  const ht = round2(subtotal - discount)
  const ratio = subtotal > 0 ? ht / subtotal : 1

  // TVA calculée par taux, sur la base après remise globale
  const byRate = new Map()
  for (const l of lines) {
    const rate = num(l.tva)
    byRate.set(rate, (byRate.get(rate) || 0) + lineTotal(l) * ratio)
  }
  const vatByRate = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, base]) => ({ rate, base: round2(base), vat: round2((base * rate) / 100) }))

  const vat = round2(vatByRate.reduce((s, r) => s + r.vat, 0))
  return { subtotal, discount, ht, vatByRate, vat, ttc: round2(ht + vat) }
}
