import { useState } from 'react'
import { computeTotals, lineTotal, TVA_RATES } from '../lib/calc'
import { money, rateLabel, uid } from '../lib/format'
import { newLine, STATUSES, TYPES } from '../lib/store'
import { Confirm, Field, Icon, StatusBadge } from '../components/ui'

export default function Editor({ id, state, go, updateDoc, deleteDoc, convertToInvoice, saveClient }) {
  const doc = state.docs.find((d) => d.id === id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!doc) {
    return (
      <div className="page">
        <div className="empty">
          <h3>Document introuvable</h3>
          <button className="btn btn-dark" onClick={() => go('documents')}>Retour aux documents</button>
        </div>
      </div>
    )
  }

  const t = computeTotals(doc)
  const type = TYPES[doc.type]
  const isDevis = doc.type === 'devis'
  const linked = isDevis ? state.docs.find((d) => d.type === 'facture' && d.fromId === doc.id) : null
  const source = !isDevis && doc.fromId ? state.docs.find((d) => d.id === doc.fromId) : null

  const set = (patch) => updateDoc({ ...doc, ...patch })
  const setClient = (patch) => set({ client: { ...doc.client, ...patch } })
  const setLine = (lid, patch) => set({ lines: doc.lines.map((l) => (l.id === lid ? { ...l, ...patch } : l)) })
  const addLine = () => set({ lines: [...doc.lines, newLine()] })
  const removeLine = (lid) => set({ lines: doc.lines.length > 1 ? doc.lines.filter((l) => l.id !== lid) : doc.lines })

  const pickClient = (cid) => {
    const c = state.clients.find((x) => x.id === cid)
    if (c) setClient({ ...c })
  }

  const saveToBook = () => {
    if (!doc.client.name.trim()) return
    const existing = doc.client.id && state.clients.some((c) => c.id === doc.client.id)
    const client = { ...doc.client, id: existing ? doc.client.id : uid() }
    saveClient(client)
    setClient({ id: client.id })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const withPdf = async (mode) => {
    setBusy(true)
    try {
      const pdf = await import('../lib/pdf')
      if (mode === 'download') pdf.downloadPdf(doc, state.company)
      else pdf.previewPdf(doc, state.company)
    } finally {
      setBusy(false)
    }
  }

  const missingCompany = !state.company.name

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <button className="link-back" onClick={() => go('documents')}>
            <Icon name="back" size={16} /> Documents
          </button>
          <h1>
            {type.label} <span className="accent">{doc.number}</span>
          </h1>
          {source && (
            <p className="hint">
              Créée depuis le devis <button className="link" onClick={() => go('editor', source.id)}>{source.number}</button>
            </p>
          )}
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" disabled={busy} onClick={() => withPdf('preview')}>
            <Icon name="eye" /> Aperçu
          </button>
          <button className="btn btn-dark" disabled={busy} onClick={() => withPdf('download')}>
            <Icon name="download" /> Télécharger le PDF
          </button>
          {isDevis && (
            <button className="btn btn-accent" onClick={() => convertToInvoice(doc.id)}>
              <Icon name="arrow" /> {linked ? `Ouvrir ${linked.number}` : 'Transformer en facture'}
            </button>
          )}
        </div>
      </header>

      {missingCompany && (
        <button className="banner" onClick={() => go('company')}>
          <div>
            <strong>Les informations de votre entreprise sont vides</strong>
            <span>Renseignez-les pour qu’elles figurent sur le PDF.</span>
          </div>
          <Icon name="arrow" />
        </button>
      )}

      <div className="editor">
        <div className="editor-main">
          <section className="card">
            <h2>Document</h2>
            <div className="grid">
              <Field label="Date d’émission">
                <input type="date" value={doc.date} onChange={(e) => set({ date: e.target.value })} />
              </Field>
              <Field label={type.dateLabel}>
                <input type="date" value={doc.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
              </Field>
              <Field label="Statut">
                <select value={doc.status} onChange={(e) => set({ status: e.target.value })}>
                  {STATUSES[doc.type].map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="card">
            <h2>Client</h2>
            {state.clients.length > 0 && (
              <Field label="Choisir dans le carnet" wide>
                <select value="" onChange={(e) => pickClient(e.target.value)}>
                  <option value="">Sélectionner un client…</option>
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid">
              <Field label="Nom ou raison sociale" wide>
                <input value={doc.client.name} onChange={(e) => setClient({ name: e.target.value })} placeholder="Ex. Martin Rénovation" />
              </Field>
              <Field label="Adresse" wide>
                <textarea rows="2" value={doc.client.address} onChange={(e) => setClient({ address: e.target.value })} placeholder={'12 rue des Lilas\n75011 Paris'} />
              </Field>
              <Field label="E-mail">
                <input type="email" value={doc.client.email} onChange={(e) => setClient({ email: e.target.value })} />
              </Field>
              <Field label="Téléphone">
                <input type="tel" value={doc.client.phone} onChange={(e) => setClient({ phone: e.target.value })} />
              </Field>
              <Field label="SIRET du client" wide>
                <input inputMode="numeric" value={doc.client.siret} onChange={(e) => setClient({ siret: e.target.value })} placeholder="14 chiffres" />
              </Field>
            </div>
            <button className="btn btn-ghost small" onClick={saveToBook} disabled={!doc.client.name.trim()}>
              {saved ? <><Icon name="check" size={16} /> Enregistré</> : 'Enregistrer dans le carnet de clients'}
            </button>
          </section>

          <section className="card">
            <h2>Prestations</h2>
            <div className="lines">
              {doc.lines.map((l, i) => (
                <div className="line" key={l.id}>
                  <div className="line-desc">
                    <span className="line-n">{i + 1}</span>
                    <input value={l.desc} onChange={(e) => setLine(l.id, { desc: e.target.value })} placeholder="Description de la prestation" aria-label={`Description ligne ${i + 1}`} />
                  </div>
                  <label>
                    <span>Qté</span>
                    <input inputMode="decimal" value={l.qty} onChange={(e) => setLine(l.id, { qty: e.target.value })} />
                  </label>
                  <label>
                    <span>PU HT (€)</span>
                    <input inputMode="decimal" value={l.price} onChange={(e) => setLine(l.id, { price: e.target.value })} placeholder="0,00" />
                  </label>
                  <label>
                    <span>TVA</span>
                    <select value={l.tva} onChange={(e) => setLine(l.id, { tva: Number(e.target.value) })}>
                      {TVA_RATES.map((r) => (
                        <option key={r} value={r}>{rateLabel(r)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Remise %</span>
                    <input inputMode="decimal" value={l.discount} onChange={(e) => setLine(l.id, { discount: e.target.value })} />
                  </label>
                  <div className="line-total">
                    <span>Total HT</span>
                    <b>{money(lineTotal(l))}</b>
                  </div>
                  <button className="icon-btn" onClick={() => removeLine(l.id)} disabled={doc.lines.length === 1} aria-label={`Supprimer la ligne ${i + 1}`}>
                    <Icon name="trash" />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost small" onClick={addLine}>
              <Icon name="plus" size={16} /> Ajouter une ligne
            </button>
          </section>

          <section className="card">
            <h2>Remise globale et notes</h2>
            <div className="grid">
              <Field label="Remise sur le total HT">
                <div className="input-group">
                  <input inputMode="decimal" value={doc.discountValue} onChange={(e) => set({ discountValue: e.target.value })} />
                  <select value={doc.discountType} onChange={(e) => set({ discountType: e.target.value })} aria-label="Type de remise">
                    <option value="percent">%</option>
                    <option value="amount">€</option>
                  </select>
                </div>
              </Field>
              <Field label="Conditions et notes" wide>
                <textarea rows="4" value={doc.notes} onChange={(e) => set({ notes: e.target.value })} />
              </Field>
            </div>
          </section>

          <button className="link danger" onClick={() => setConfirmDelete(true)}>
            Supprimer ce document
          </button>
        </div>

        <aside className="editor-side">
          <div className="totals">
            <div className="totals-head">
              <span>{doc.number}</span>
              <StatusBadge doc={doc} />
            </div>
            <dl>
              <div><dt>Sous-total HT</dt><dd>{money(t.subtotal)}</dd></div>
              {t.discount > 0 && (
                <>
                  <div><dt>Remise</dt><dd>− {money(t.discount)}</dd></div>
                  <div><dt>Total HT</dt><dd>{money(t.ht)}</dd></div>
                </>
              )}
              {t.vatByRate.map((r) => (
                <div key={r.rate}><dt>TVA {rateLabel(r.rate)}</dt><dd>{money(r.vat)}</dd></div>
              ))}
            </dl>
            <div className="ttc">
              <span>Total TTC</span>
              <b>{money(t.ttc)}</b>
            </div>
          </div>
        </aside>
      </div>

      {confirmDelete && (
        <Confirm
          title={`Supprimer ${doc.number} ?`}
          text="Ce document sera supprimé définitivement de cet appareil."
          confirmLabel="Supprimer"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteDoc(doc.id)
            go('documents')
          }}
        />
      )}
    </div>
  )
}
