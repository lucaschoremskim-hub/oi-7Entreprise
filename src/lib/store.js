import { useEffect, useState } from 'react'
import { addDays, todayISO, uid } from './format'

const KEY = 'oi7-devis-factures-v1'

export const emptyCompany = {
  name: '',
  siret: '',
  address: '',
  phone: '',
  email: '',
  tvaNumber: '',
  iban: '',
  bic: '',
  logo: '',
}

const initial = { company: emptyCompany, clients: [], docs: [], counters: {} }

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const data = JSON.parse(raw)
    return { ...initial, ...data, company: { ...emptyCompany, ...(data.company || {}) } }
  } catch {
    return initial
  }
}

export function useStore() {
  const [state, setState] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // stockage plein ou indisponible : l'application reste utilisable
    }
  }, [state])

  return [state, setState]
}

export const TYPES = {
  devis: { label: 'Devis', plural: 'Devis', prefix: 'DEV', dateLabel: 'Valable jusqu’au' },
  facture: { label: 'Facture', plural: 'Factures', prefix: 'FAC', dateLabel: 'Échéance' },
}

export const STATUSES = {
  devis: [
    { id: 'brouillon', label: 'Brouillon' },
    { id: 'envoye', label: 'Envoyé' },
    { id: 'accepte', label: 'Accepté' },
    { id: 'refuse', label: 'Refusé' },
  ],
  facture: [
    { id: 'brouillon', label: 'Brouillon' },
    { id: 'envoyee', label: 'Envoyée' },
    { id: 'payee', label: 'Payée' },
  ],
}

// « En retard » n'est pas stocké : il est calculé d'après l'échéance
export function effectiveStatus(doc) {
  if (doc.type === 'facture' && doc.status === 'envoyee' && doc.dueDate && doc.dueDate < todayISO()) {
    return { id: 'retard', label: 'En retard' }
  }
  const s = STATUSES[doc.type].find((x) => x.id === doc.status)
  return s || { id: doc.status, label: doc.status }
}

export function formatNumber(type, year, seq) {
  return `${TYPES[type].prefix}-${year}-${String(seq).padStart(3, '0')}`
}

// Prochain numéro : compteur par type et par année, jamais réutilisé
export function nextNumber(counters, type, year) {
  const seq = ((counters[type] || {})[year] || 0) + 1
  return { number: formatNumber(type, year, seq), counters: { ...counters, [type]: { ...(counters[type] || {}), [year]: seq } } }
}

export const DEFAULT_NOTES = {
  devis: 'Devis valable 30 jours. Acompte de 30 % à la commande.',
  facture:
    'Paiement à 30 jours. En cas de retard de paiement, pénalité de 3 fois le taux d’intérêt légal et indemnité forfaitaire de recouvrement de 40 €.',
}

export function newLine() {
  return { id: uid(), desc: '', qty: 1, price: '', tva: 20, discount: 0 }
}

export function blankDoc(type, counters) {
  const today = todayISO()
  const year = today.slice(0, 4)
  const { number, counters: next } = nextNumber(counters, type, year)
  const doc = {
    id: uid(),
    type,
    number,
    status: 'brouillon',
    date: today,
    dueDate: addDays(today, 30),
    client: { id: '', name: '', address: '', email: '', phone: '', siret: '' },
    lines: [newLine()],
    discountType: 'percent',
    discountValue: 0,
    notes: DEFAULT_NOTES[type],
    fromId: null,
  }
  return { doc, counters: next }
}
