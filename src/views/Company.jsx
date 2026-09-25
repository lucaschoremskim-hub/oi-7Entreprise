import { useRef, useState } from 'react'
import { exportBackup, parseBackup } from '../lib/store'
import { Confirm, Field, Icon } from '../components/ui'

// Réduit le logo (max 400 px) et le convertit en PNG pour rester léger dans le stockage local
function readLogo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, 400 / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function Company({ state, setCompany, restoreBackup }) {
  const c = state.company
  const fileRef = useRef(null)
  const backupRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState(null)
  const patch = (p) => setCompany({ ...c, ...p })

  const onBackupFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
      setMessage(null)
    } catch (err) {
      setMessage({ error: true, text: err.message })
    }
  }

  const onExport = () => {
    exportBackup(state)
    setMessage({ error: false, text: 'Sauvegarde téléchargée. Conservez le fichier en lieu sûr.' })
  }

  const onLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      patch({ logo: await readLogo(file) })
    } catch {
      alert('Image illisible. Essayez un fichier PNG ou JPEG.')
    }
    e.target.value = ''
  }

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <p className="eyebrow">Paramètres</p>
          <h1>Mon entreprise</h1>
          <p className="hint">Ces informations figurent sur tous vos devis et factures. Enregistrement automatique.</p>
        </div>
      </header>

      <section className="card">
        <h2>Identité</h2>
        <div className="logo-row">
          <div className="logo-box">
            {c.logo ? <img src={c.logo} alt="Logo de l’entreprise" /> : <span>Aucun logo</span>}
          </div>
          <div className="logo-actions">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogo} hidden />
            <button className="btn btn-ghost small" onClick={() => fileRef.current.click()}>
              <Icon name="upload" size={16} /> {c.logo ? 'Changer le logo' : 'Ajouter un logo'}
            </button>
            {c.logo && (
              <button className="link danger" onClick={() => patch({ logo: '' })}>Retirer</button>
            )}
          </div>
        </div>
        <div className="grid">
          <Field label="Nom de l’entreprise" wide>
            <input value={c.name} onChange={(e) => patch({ name: e.target.value })} />
          </Field>
          <Field label="SIRET">
            <input inputMode="numeric" value={c.siret} onChange={(e) => patch({ siret: e.target.value })} placeholder="14 chiffres" />
          </Field>
          <Field label="N° TVA intracommunautaire">
            <input value={c.tvaNumber} onChange={(e) => patch({ tvaNumber: e.target.value })} placeholder="FR00 000000000" />
          </Field>
          <Field label="Adresse" wide>
            <textarea rows="2" value={c.address} onChange={(e) => patch({ address: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <input type="tel" value={c.phone} onChange={(e) => patch({ phone: e.target.value })} />
          </Field>
          <Field label="E-mail">
            <input type="email" value={c.email} onChange={(e) => patch({ email: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="card">
        <h2>Coordonnées bancaires</h2>
        <div className="grid">
          <Field label="IBAN" wide>
            <input value={c.iban} onChange={(e) => patch({ iban: e.target.value })} placeholder="FR76 0000 0000 0000 0000 0000 000" />
          </Field>
          <Field label="BIC">
            <input value={c.bic} onChange={(e) => patch({ bic: e.target.value })} />
          </Field>
        </div>
        <p className="hint">Affichées sur les factures pour le paiement par virement.</p>
      </section>

      <section className="card">
        <h2>Sauvegarde des données</h2>
        <p className="hint">
          Vos documents sont enregistrés dans ce navigateur uniquement. Téléchargez régulièrement une sauvegarde, et
          importez-la pour retrouver vos données après un changement d’appareil ou un nettoyage du navigateur.
        </p>
        <p className="hint">
          {state.docs.length} document{state.docs.length > 1 ? 's' : ''} · {state.clients.length} client{state.clients.length > 1 ? 's' : ''}
        </p>
        <div className="form-actions start">
          <button className="btn btn-dark" onClick={onExport}>
            <Icon name="download" /> Télécharger une sauvegarde
          </button>
          <input ref={backupRef} type="file" accept="application/json,.json" onChange={onBackupFile} hidden />
          <button className="btn btn-ghost" onClick={() => backupRef.current.click()}>
            <Icon name="upload" /> Importer une sauvegarde
          </button>
        </div>
        {message && <p className={message.error ? 'notice err' : 'notice ok'}>{message.text}</p>}
      </section>

      {pending && (
        <Confirm
          title="Remplacer les données actuelles ?"
          text={`Cette sauvegarde contient ${pending.docs.length} document(s) et ${pending.clients.length} client(s). Elle remplacera tout ce qui est enregistré actuellement dans ce navigateur.`}
          confirmLabel="Remplacer"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            restoreBackup(pending)
            setPending(null)
            setMessage({ error: false, text: 'Sauvegarde importée.' })
          }}
        />
      )}
    </div>
  )
}
