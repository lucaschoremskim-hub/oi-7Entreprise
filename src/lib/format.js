const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateLong = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const money = (n) => eur.format(Number.isFinite(n) ? n : 0)

// jsPDF ne sait pas afficher les espaces insécables fines : on les remplace
export const moneyPdf = (n) => money(n).replace(/[  ]/g, ' ')

export const fmtDate = (iso) => (iso ? dateFmt.format(new Date(iso + 'T00:00:00')) : '')
export const fmtDateLong = (iso) => (iso ? dateLong.format(new Date(iso + 'T00:00:00')) : '')

export const todayISO = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const addDays = (iso, days) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const rateLabel = (r) => `${String(r).replace('.', ',')} %`
