import { computeTotals } from '../lib/calc'
import { fmtDate, money, todayISO } from '../lib/format'
import { effectiveStatus } from '../lib/store'
import { Icon, StatusBadge } from '../components/ui'

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export default function Dashboard({ state, go, createDoc }) {
  const year = todayISO().slice(0, 4)
  const docs = state.docs.map((d) => ({ d, t: computeTotals(d) }))
  const factures = docs.filter((x) => x.d.type === 'facture' && x.d.status !== 'brouillon')
  const devis = docs.filter((x) => x.d.type === 'devis')

  const sum = (list, key) => list.reduce((s, x) => s + x.t[key], 0)
  const yearFactures = factures.filter((x) => x.d.date.startsWith(year))
  const caHT = sum(yearFactures, 'ht')
  const paid = sum(factures.filter((x) => x.d.status === 'payee'), 'ttc')
  const late = factures.filter((x) => effectiveStatus(x.d).id === 'retard')
  const due = factures.filter((x) => x.d.status === 'envoyee')
  const pendingDevis = devis.filter((x) => x.d.status === 'envoye')

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`
    return factures.filter((x) => x.d.date.startsWith(key)).reduce((s, x) => s + x.t.ht, 0)
  })
  const max = Math.max(...monthly, 1)
  const currentMonth = new Date().getMonth()

  const recent = state.docs.slice(0, 6)
  const company = state.company

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Tableau de bord</p>
          <h1>{company.name ? `Bonjour, ${company.name}` : 'Bienvenue sur Oi-7 Entreprise'}</h1>
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

      {!company.name && (
        <button className="banner" onClick={() => go('company')}>
          <div>
            <strong>Commencez par renseigner votre entreprise</strong>
            <span>Nom, SIRET, adresse, logo et IBAN apparaîtront sur chaque document.</span>
          </div>
          <Icon name="arrow" />
        </button>
      )}

      <section className="kpis">
        <div className="kpi kpi-main">
          <span>Chiffre d’affaires facturé {year} (HT)</span>
          <b>{money(caHT)}</b>
        </div>
        <div className="kpi">
          <span>Encaissé (TTC)</span>
          <b className="pos">{money(paid)}</b>
        </div>
        <div className="kpi">
          <span>À encaisser ({due.length})</span>
          <b>{money(sum(due, 'ttc'))}</b>
        </div>
        <div className="kpi">
          <span>En retard ({late.length})</span>
          <b className={late.length ? 'neg' : ''}>{money(sum(late, 'ttc'))}</b>
        </div>
        <div className="kpi">
          <span>Devis en attente ({pendingDevis.length})</span>
          <b>{money(sum(pendingDevis, 'ttc'))}</b>
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <h2>Facturation mensuelle {year} <small>HT</small></h2>
          <svg className="chart" viewBox="0 0 480 190" role="img" aria-label="Facturation mensuelle en euros HT">
            {[0, 0.5, 1].map((f) => (
              <line key={f} x1="0" x2="480" y1={150 - f * 130} y2={150 - f * 130} className="grid-line" />
            ))}
            {monthly.map((v, i) => {
              const h = (v / max) * 130
              return (
                <g key={i}>
                  <rect x={i * 40 + 8} y={150 - h} width="24" height={Math.max(h, v > 0 ? 2 : 0)} rx="3" className={i === currentMonth ? 'bar bar-now' : 'bar'} />
                  <text x={i * 40 + 20} y="172" textAnchor="middle" className="axis">{MONTHS[i]}</text>
                  {v > 0 && (
                    <text x={i * 40 + 20} y={150 - h - 6} textAnchor="middle" className="bar-label">
                      {v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')} k` : Math.round(v)}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          {factures.length === 0 && <p className="hint">Le graphique se remplit dès qu’une facture est envoyée.</p>}
        </section>

        <section className="card">
          <h2>Derniers documents</h2>
          {recent.length === 0 ? (
            <p className="hint">Aucun document pour l’instant. Créez votre premier devis.</p>
          ) : (
            <ul className="mini-list">
              {recent.map((d) => (
                <li key={d.id}>
                  <button onClick={() => go('editor', d.id)}>
                    <div>
                      <strong>{d.number}</strong>
                      <span>{d.client.name || 'Sans client'} · {fmtDate(d.date)}</span>
                    </div>
                    <div className="right">
                      <b>{money(computeTotals(d).ttc)}</b>
                      <StatusBadge doc={d} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
