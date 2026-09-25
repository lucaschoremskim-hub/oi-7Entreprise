import { useState } from 'react'
import { computeTotals } from '../lib/calc'
import { fmtDate, money } from '../lib/format'
import { Confirm, Icon, StatusBadge } from '../components/ui'

const TABS = [
  { id: 'all', label: 'Tous' },
  { id: 'devis', label: 'Devis' },
  { id: 'facture', label: 'Factures' },
]

export default function Documents({ state, go, createDoc, deleteDoc, initialType }) {
  const [tab, setTab] = useState(initialType || 'all')
  const [q, setQ] = useState('')
  const [toDelete, setToDelete] = useState(null)

  const needle = q.trim().toLowerCase()
  const list = state.docs.filter(
    (d) =>
      (tab === 'all' || d.type === tab) &&
      (!needle || d.number.toLowerCase().includes(needle) || d.client.name.toLowerCase().includes(needle)),
  )

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Documents</p>
          <h1>Devis et factures</h1>
        </div>
        <div className="head-actions">
          <button className="btn btn-accent" onClick={() => createDoc('devis')}>
            <Icon name="plus" /> Nouveau devis
          </button>
          <button className="btn btn-dark" onClick={() => createDoc('facture')}>
            <Icon name="plus" /> Nouvelle facture
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <input className="search" type="search" placeholder="Rechercher un numéro ou un client" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h3>{state.docs.length === 0 ? 'Aucun document' : 'Aucun résultat'}</h3>
          <p>{state.docs.length === 0 ? 'Créez votre premier devis pour commencer.' : 'Essayez un autre filtre ou une autre recherche.'}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th className="num">Total TTC</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} onClick={() => go('editor', d.id)}>
                  <td data-label="Numéro"><strong>{d.number}</strong></td>
                  <td data-label="Client">{d.client.name || <span className="muted">Sans client</span>}</td>
                  <td data-label="Date">{fmtDate(d.date)}</td>
                  <td data-label="Statut"><StatusBadge doc={d} /></td>
                  <td data-label="Total TTC" className="num"><b>{money(computeTotals(d).ttc)}</b></td>
                  <td className="row-actions">
                    <button
                      className="icon-btn"
                      aria-label={`Supprimer ${d.number}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setToDelete(d)
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <Confirm
          title={`Supprimer ${toDelete.number} ?`}
          text="Ce document sera supprimé définitivement de cet appareil. Son numéro ne sera pas réattribué."
          confirmLabel="Supprimer"
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            deleteDoc(toDelete.id)
            setToDelete(null)
          }}
        />
      )}
    </div>
  )
}
