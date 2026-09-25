import { useState } from 'react'
import { blankDoc, DEFAULT_NOTES, useStore } from './lib/store'
import { uid } from './lib/format'
import { Icon } from './components/ui'
import Dashboard from './views/Dashboard'
import Documents from './views/Documents'
import Editor from './views/Editor'
import Clients from './views/Clients'
import Company from './views/Company'

const NAV = [
  { id: 'dashboard', label: 'Accueil', icon: 'home' },
  { id: 'documents', label: 'Documents', icon: 'file' },
  { id: 'clients', label: 'Clients', icon: 'users' },
  { id: 'company', label: 'Entreprise', icon: 'building' },
]

export default function App() {
  const [state, setState] = useStore()
  const [view, setView] = useState({ name: 'dashboard' })
  const go = (name, id, extra) => {
    setView({ name, id, ...extra })
    window.scrollTo(0, 0)
  }

  const createDoc = (type) => {
    const { doc, counters } = blankDoc(type, state.counters)
    setState((s) => ({ ...s, docs: [doc, ...s.docs], counters }))
    go('editor', doc.id)
  }

  const updateDoc = (doc) => setState((s) => ({ ...s, docs: s.docs.map((d) => (d.id === doc.id ? doc : d)) }))

  const deleteDoc = (id) => setState((s) => ({ ...s, docs: s.docs.filter((d) => d.id !== id) }))

  // Devis -> facture en un clic. Si la facture existe déjà, on l'ouvre au lieu d'en créer une seconde.
  const convertToInvoice = (devisId) => {
    const existing = state.docs.find((d) => d.type === 'facture' && d.fromId === devisId)
    if (existing) return go('editor', existing.id)
    const devis = state.docs.find((d) => d.id === devisId)
    if (!devis) return
    const { doc, counters } = blankDoc('facture', state.counters)
    const facture = {
      ...doc,
      client: { ...devis.client },
      lines: devis.lines.map((l) => ({ ...l, id: uid() })),
      discountType: devis.discountType,
      discountValue: devis.discountValue,
      notes: DEFAULT_NOTES.facture,
      fromId: devis.id,
      fromNumber: devis.number,
    }
    setState((s) => ({
      ...s,
      counters,
      docs: [facture, ...s.docs.map((d) => (d.id === devis.id && d.status !== 'refuse' ? { ...d, status: 'accepte' } : d))],
    }))
    go('editor', facture.id)
  }

  const saveClient = (client) =>
    setState((s) => {
      const exists = s.clients.some((c) => c.id === client.id)
      return { ...s, clients: exists ? s.clients.map((c) => (c.id === client.id ? client : c)) : [...s.clients, client] }
    })
  const deleteClient = (id) => setState((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }))
  const setCompany = (company) => setState((s) => ({ ...s, company }))

  const activeNav = view.name === 'editor' ? 'documents' : view.name
  const shared = { state, go, createDoc, updateDoc, deleteDoc, convertToInvoice, saveClient, deleteClient, setCompany }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="brand-name">
            Oi-7 <small>Entreprise</small>
          </span>
        </div>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={`nav-item${activeNav === n.id ? ' active' : ''}`} onClick={() => go(n.id)}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="btn btn-accent block" onClick={() => createDoc('devis')}>
            <Icon name="plus" /> Nouveau devis
          </button>
          <button className="btn btn-dark block" onClick={() => createDoc('facture')}>
            <Icon name="plus" /> Nouvelle facture
          </button>
          <p className="local-note">Données enregistrées sur cet appareil.</p>
        </div>
      </aside>

      <main className="main">
        {view.name === 'dashboard' && <Dashboard {...shared} />}
        {view.name === 'documents' && <Documents {...shared} initialType={view.type} />}
        {view.name === 'editor' && <Editor key={view.id} {...shared} id={view.id} />}
        {view.name === 'clients' && <Clients {...shared} />}
        {view.name === 'company' && <Company {...shared} />}
      </main>
    </div>
  )
}
