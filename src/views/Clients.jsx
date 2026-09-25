import { useState } from 'react'
import { uid } from '../lib/format'
import { Confirm, Field, Icon } from '../components/ui'

const EMPTY = { id: '', name: '', address: '', email: '', phone: '', siret: '' }

export default function Clients({ state, saveClient, deleteClient }) {
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    saveClient({ ...form, id: form.id || uid() })
    setForm(null)
  }
  const patch = (p) => setForm({ ...form, ...p })

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Carnet</p>
          <h1>Clients</h1>
        </div>
        <div className="head-actions">
          <button className="btn btn-accent" onClick={() => setForm({ ...EMPTY })}>
            <Icon name="plus" /> Nouveau client
          </button>
        </div>
      </header>

      {form && (
        <form className="card" onSubmit={submit}>
          <h2>{form.id ? 'Modifier le client' : 'Nouveau client'}</h2>
          <div className="grid">
            <Field label="Nom ou raison sociale" wide>
              <input required value={form.name} onChange={(e) => patch({ name: e.target.value })} autoFocus />
            </Field>
            <Field label="Adresse" wide>
              <textarea rows="2" value={form.address} onChange={(e) => patch({ address: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <input type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <input type="tel" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
            </Field>
            <Field label="SIRET" wide>
              <input inputMode="numeric" value={form.siret} onChange={(e) => patch({ siret: e.target.value })} />
            </Field>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Annuler</button>
            <button type="submit" className="btn btn-dark">Enregistrer</button>
          </div>
        </form>
      )}

      {state.clients.length === 0 && !form ? (
        <div className="empty">
          <h3>Aucun client enregistré</h3>
          <p>Ajoutez un client ici, ou enregistrez-le depuis un devis.</p>
        </div>
      ) : (
        <div className="client-grid">
          {state.clients.map((c) => (
            <article className="client-card" key={c.id}>
              <h3>{c.name}</h3>
              {c.address && <p className="pre">{c.address}</p>}
              <p className="muted">{[c.email, c.phone].filter(Boolean).join(' · ')}</p>
              {c.siret && <p className="muted">SIRET {c.siret}</p>}
              <div className="card-actions">
                <button className="btn btn-ghost small" onClick={() => setForm({ ...c })}>Modifier</button>
                <button className="icon-btn" aria-label={`Supprimer ${c.name}`} onClick={() => setToDelete(c)}>
                  <Icon name="trash" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {toDelete && (
        <Confirm
          title={`Supprimer ${toDelete.name} ?`}
          text="Le client est retiré du carnet. Les documents déjà créés conservent ses informations."
          confirmLabel="Supprimer"
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            deleteClient(toDelete.id)
            setToDelete(null)
          }}
        />
      )}
    </div>
  )
}
