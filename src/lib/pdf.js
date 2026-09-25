import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { computeTotals, lineTotal } from './calc'
import { fmtDate, moneyPdf, rateLabel } from './format'
import { TYPES } from './store'

const ANTHRACITE = [35, 39, 46]
const ORANGE = [242, 140, 40]
const GREY = [110, 116, 126]
const LIGHT = [244, 245, 247]
const LINE = [222, 225, 230]

const PAGE_W = 210
const MARGIN = 16

function splitLines(doc, text, width) {
  return doc.splitTextToSize(String(text || ''), width)
}

function logoFormat(dataUrl) {
  return dataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
}

export function buildPdf(docData, company) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const t = computeTotals(docData)
  const isFacture = docData.type === 'facture'
  const title = TYPES[docData.type].label.toUpperCase()

  // Bandeau supérieur
  pdf.setFillColor(...ANTHRACITE)
  pdf.rect(0, 0, PAGE_W, 6, 'F')
  pdf.setFillColor(...ORANGE)
  pdf.rect(0, 6, PAGE_W, 1.2, 'F')

  // Émetteur (gauche)
  let y = 20
  let textX = MARGIN
  if (company.logo) {
    try {
      const props = pdf.getImageProperties(company.logo)
      const h = 18
      const w = Math.min((props.width / props.height) * h, 46)
      pdf.addImage(company.logo, logoFormat(company.logo), MARGIN, y - 4, w, w / (props.width / props.height))
      textX = MARGIN
      y += h + 2
    } catch {
      /* logo illisible : on continue sans */
    }
  }
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.setTextColor(...ANTHRACITE)
  pdf.text(company.name || 'Votre entreprise', textX, y)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...GREY)
  let ey = y + 5
  for (const line of splitLines(pdf, company.address, 80)) {
    pdf.text(line, textX, ey)
    ey += 4.2
  }
  const contact = [company.phone, company.email].filter(Boolean).join('  ·  ')
  if (contact) {
    pdf.text(contact, textX, ey)
    ey += 4.2
  }
  if (company.siret) {
    pdf.text(`SIRET : ${company.siret}`, textX, ey)
    ey += 4.2
  }
  if (company.tvaNumber) {
    pdf.text(`N° TVA : ${company.tvaNumber}`, textX, ey)
    ey += 4.2
  }

  // Titre du document (droite)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(26)
  pdf.setTextColor(...ANTHRACITE)
  pdf.text(title, PAGE_W - MARGIN, 26, { align: 'right' })
  pdf.setFontSize(11)
  pdf.setTextColor(...ORANGE)
  pdf.text(`N° ${docData.number}`, PAGE_W - MARGIN, 33, { align: 'right' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...GREY)
  pdf.text(`Date d'émission : ${fmtDate(docData.date)}`, PAGE_W - MARGIN, 40, { align: 'right' })
  if (docData.dueDate) {
    pdf.text(`${TYPES[docData.type].dateLabel} : ${fmtDate(docData.dueDate)}`, PAGE_W - MARGIN, 45, {
      align: 'right',
    })
  }

  // Bloc client
  const blockY = Math.max(ey, 52) + 6
  const c = docData.client
  const clientLines = [
    ...splitLines(pdf, c.address, 84),
    c.email,
    c.phone,
    c.siret ? `SIRET : ${c.siret}` : '',
  ].filter(Boolean)
  const blockH = 14 + clientLines.length * 4.2
  pdf.setFillColor(...LIGHT)
  pdf.roundedRect(PAGE_W / 2 + 4, blockY, PAGE_W / 2 - MARGIN - 4, blockH, 2, 2, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...ORANGE)
  pdf.text(isFacture ? 'FACTURÉ À' : 'DESTINATAIRE', PAGE_W / 2 + 8, blockY + 6)
  pdf.setFontSize(10.5)
  pdf.setTextColor(...ANTHRACITE)
  pdf.text(c.name || 'Client', PAGE_W / 2 + 8, blockY + 11.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...GREY)
  let cy = blockY + 16.5
  for (const line of clientLines) {
    pdf.text(String(line), PAGE_W / 2 + 8, cy)
    cy += 4.2
  }

  // Tableau des prestations
  const hasDiscount = docData.lines.some((l) => Number(l.discount) > 0)
  const head = ['Description', 'Qté', 'PU HT', 'TVA']
  if (hasDiscount) head.push('Remise')
  head.push('Total HT')
  const body = docData.lines
    .filter((l) => l.desc || Number(l.price))
    .map((l) => {
      const row = [
        l.desc,
        String(l.qty).replace('.', ','),
        moneyPdf(parseFloat(String(l.price).replace(',', '.')) || 0),
        rateLabel(l.tva),
      ]
      if (hasDiscount) row.push(Number(l.discount) > 0 ? `${String(l.discount).replace('.', ',')} %` : '')
      row.push(moneyPdf(lineTotal(l)))
      return row
    })

  const numCols = hasDiscount ? { 1: 14, 2: 26, 3: 16, 4: 18, 5: 28 } : { 1: 14, 2: 26, 3: 16, 4: 28 }
  const columnStyles = { 0: { cellWidth: 'auto' } }
  Object.entries(numCols).forEach(([i, w]) => (columnStyles[i] = { cellWidth: w, halign: 'right' }))

  autoTable(pdf, {
    startY: blockY + blockH + 10,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN, bottom: 30 },
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: ANTHRACITE, cellPadding: { top: 3.2, bottom: 3.2, left: 2.5, right: 2.5 }, lineColor: LINE, lineWidth: 0 },
    headStyles: { fillColor: ANTHRACITE, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    columnStyles,
    didParseCell: (d) => {
      if (d.section === 'head' && d.column.index > 0) d.cell.styles.halign = 'right'
    },
    didDrawCell: (d) => {
      if (d.section === 'body') {
        pdf.setDrawColor(...LINE)
        pdf.setLineWidth(0.2)
        pdf.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height)
      }
    },
  })

  // Totaux
  let ty = pdf.lastAutoTable.finalY + 8
  const boxW = 78
  const boxX = PAGE_W - MARGIN - boxW
  const rows = [['Sous-total HT', moneyPdf(t.subtotal)]]
  if (t.discount > 0) {
    const d = docData.discountType === 'percent' ? ` (${String(docData.discountValue).replace('.', ',')} %)` : ''
    rows.push([`Remise${d}`, '- ' + moneyPdf(t.discount)])
    rows.push(['Total HT', moneyPdf(t.ht)])
  }
  for (const r of t.vatByRate) rows.push([`TVA ${rateLabel(r.rate)}`, moneyPdf(r.vat)])
  const totalsH = rows.length * 6 + 14
  if (ty + totalsH > 265) {
    pdf.addPage()
    ty = 20
  }
  pdf.setFontSize(9.5)
  rows.forEach(([label, val], i) => {
    const ry = ty + i * 6
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...GREY)
    pdf.text(label, boxX, ry)
    pdf.setTextColor(...ANTHRACITE)
    pdf.text(val, PAGE_W - MARGIN, ry, { align: 'right' })
  })
  const ttcY = ty + rows.length * 6 + 1
  pdf.setFillColor(...ANTHRACITE)
  pdf.roundedRect(boxX - 3, ttcY, boxW + 3, 11, 1.5, 1.5, 'F')
  pdf.setFillColor(...ORANGE)
  pdf.rect(boxX - 3, ttcY + 1.5, 1.2, 8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(255, 255, 255)
  pdf.text('TOTAL TTC', boxX + 2, ttcY + 7)
  pdf.setFontSize(12)
  pdf.text(moneyPdf(t.ttc), PAGE_W - MARGIN - 2, ttcY + 7.2, { align: 'right' })

  // Notes, paiement, signature (à gauche des totaux)
  let ny = ty - 3
  const leftW = boxX - MARGIN - 8
  const section = (label, lines) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...ORANGE)
    pdf.text(label, MARGIN, ny)
    ny += 4.5
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...GREY)
    for (const l of lines) {
      pdf.text(l, MARGIN, ny)
      ny += 3.9
    }
    ny += 3
  }
  if (docData.notes) section('CONDITIONS ET NOTES', splitLines(pdf, docData.notes, leftW))
  if (isFacture && (company.iban || company.bic)) {
    const pay = []
    if (company.iban) pay.push(`IBAN : ${company.iban}`)
    if (company.bic) pay.push(`BIC : ${company.bic}`)
    pay.push(`Référence : ${docData.number}`)
    section('RÈGLEMENT PAR VIREMENT', pay)
  }

  let sy = Math.max(ny, ttcY + 18)
  if (!isFacture) {
    if (sy + 30 > 275) {
      pdf.addPage()
      sy = 20
    }
    pdf.setDrawColor(...LINE)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(MARGIN, sy, 84, 26, 2, 2, 'S')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...ANTHRACITE)
    pdf.text('BON POUR ACCORD', MARGIN + 4, sy + 6)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...GREY)
    pdf.text('Date, signature et mention « Bon pour accord »', MARGIN + 4, sy + 11)
  }

  // Pied de page sur chaque page
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    pdf.setDrawColor(...LINE)
    pdf.setLineWidth(0.3)
    pdf.line(MARGIN, 283, PAGE_W - MARGIN, 283)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(...GREY)
    const foot = [company.name, company.siret && `SIRET ${company.siret}`, company.tvaNumber && `TVA ${company.tvaNumber}`]
      .filter(Boolean)
      .join('  ·  ')
    pdf.text(foot, MARGIN, 288)
    pdf.text(`${docData.number}  ·  Page ${i}/${pages}`, PAGE_W - MARGIN, 288, { align: 'right' })
  }

  return pdf
}

export function downloadPdf(docData, company) {
  buildPdf(docData, company).save(`${docData.number}.pdf`)
}

export function previewPdf(docData, company) {
  const blob = buildPdf(docData, company).output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
