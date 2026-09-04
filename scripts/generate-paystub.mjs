import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const COLORS = {
  ink: '#0A0A0A',
  body: '#2A2A2A',
  muted: '#6B6B6B',
  line: '#DDDDDD',
  rule: '#BBBBBB',
  accent: '#C5FF3E',
  panel: '#F7F7F7',
  border: '#E0E0E0',
}

const MARGIN = 42

// ── Money: integer cents everywhere, formatted only at render time ──────────
function money(cents, currency = 'USD') {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const int = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const frac = String(abs % 100).padStart(2, '0')
  const symbol = currency === 'BRL' ? 'R$ ' : '$'
  return `${sign}${symbol}${int}.${frac}`
}

function totals(data) {
  const sum = (rows, key) => rows.reduce((acc, r) => acc + (r[key] ?? 0), 0)
  const grossCents = sum(data.earnings, 'amountCents')
  const deductionsCents = sum(data.deductions ?? [], 'amountCents')
  const netCents = grossCents - deductionsCents
  assert.ok(Number.isInteger(grossCents), 'earnings amountCents must be integers')
  assert.ok(Number.isInteger(deductionsCents), 'deductions amountCents must be integers')
  assert.ok(netCents >= 0, `net pay negative: gross ${grossCents} - deductions ${deductionsCents}`)
  return {
    grossCents,
    deductionsCents,
    netCents,
    grossYtdCents: data.earnings.every((e) => e.ytdCents == null) ? null : sum(data.earnings, 'ytdCents'),
    deductionsYtdCents: (data.deductions ?? []).every((d) => d.ytdCents == null) ? null : sum(data.deductions ?? [], 'ytdCents'),
  }
}

function validate(data) {
  assert.ok(data.payee?.name, 'payee.name required')
  assert.ok(data.period?.payDate, 'period.payDate required')
  assert.ok(data.earnings?.length, 'at least one earnings line required')
  const cls = data.payee.classification
  assert.ok(cls === 'contractor' || cls === 'employee', 'payee.classification: contractor | employee')
  // ponytail: contractor statements must not carry fabricated U.S. withholding
  if (cls === 'contractor') {
    assert.equal(
      (data.deductions ?? []).length,
      0,
      'contractor statements carry no U.S. tax withholding — use classification "employee" for real W-2 payroll',
    )
  }
  const last4 = data.deposit?.last4
  if (last4 != null) {
    assert.match(String(last4), /^\d{4}$/, 'deposit.last4 must be exactly 4 digits — never store the full account number')
  }
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

// ── Render ──────────────────────────────────────────────────────────────────
function render(data, outputPath) {
  const t = totals(data)
  const cur = data.currency ?? 'USD'
  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN })
  const stream = fs.createWriteStream(outputPath)
  doc.pipe(stream)

  const left = MARGIN
  const width = doc.page.width - MARGIN * 2
  const logoPath = path.join(root, 'public', 'logo-tazz.png')

  const hr = (y, color = COLORS.line, w = 0.6) =>
    doc.moveTo(left, y).lineTo(left + width, y).strokeColor(color).lineWidth(w).stroke()

  const label = (text, x, y, w) =>
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(COLORS.muted)
      .text(text.toUpperCase(), x, y, { width: w, characterSpacing: 0.4 })

  const value = (text, x, y, w, size = 9.5) =>
    doc.font('Helvetica').fontSize(size).fillColor(COLORS.ink).text(text, x, y, { width: w, lineGap: 2 })

  // Header band
  const headerH = 72
  const headerY = doc.y
  doc.rect(left, headerY, width, headerH).fill(COLORS.ink)
  if (fs.existsSync(logoPath)) doc.image(logoPath, left + 18, headerY + 20, { width: 86 })
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
    .text(data.employer.name, left + width - 290, headerY + 14, { width: 272, align: 'right' })
  doc.font('Helvetica').fontSize(7.5).fillColor('#AAAAAA')
    .text(data.employer.address.join(' · '), left + width - 290, headerY + 27, { width: 272, align: 'right', lineGap: 1 })
  if (data.employer.ein) {
    doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.accent)
      .text(`EIN ${data.employer.ein}`, left + width - 290, headerY + 52, { width: 272, align: 'right' })
  }

  doc.y = headerY + headerH + 18

  // Title row
  const titleY = doc.y
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.ink)
    .text(data.payee.classification === 'employee' ? 'EARNINGS STATEMENT' : 'CONTRACTOR PAYMENT STATEMENT', left, titleY, { width: width * 0.6, characterSpacing: 0.6 })
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
    .text(`Statement no. ${data.period.statementNo}`, left + width * 0.6, titleY + 2, { width: width * 0.4, align: 'right' })
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.ink)
    .text(`Pay date ${fmtDate(data.period.payDate)}`, left + width * 0.6, titleY + 14, { width: width * 0.4, align: 'right' })

  doc.y = titleY + 30
  hr(doc.y, COLORS.accent, 2)
  doc.y += 14

  // Employer / payee panels
  const panelY = doc.y
  const employerLines = [data.employer.name, ...data.employer.address]
  const payeeIdLine = [data.payee.workerId && `ID ${data.payee.workerId}`, data.payee.taxIdLast4 && `Tax ID •••${data.payee.taxIdLast4}`].filter(Boolean).join('   ')
  const payeeLines = [data.payee.name, ...data.payee.address, payeeIdLine].filter(Boolean)
  const panelH = 39 + Math.max(employerLines.length, payeeLines.length) * 11 + 8
  const gap = 12
  const panelW = (width - gap) / 2
  ;[
    { title: 'Paid by', lines: employerLines },
    { title: data.payee.classification === 'employee' ? 'Employee' : 'Contractor', lines: payeeLines },
  ].forEach((panel, i) => {
    const x = left + i * (panelW + gap)
    doc.roundedRect(x, panelY, panelW, panelH, 5).fillAndStroke('#FFFFFF', COLORS.border)
    label(panel.title, x + 12, panelY + 11, panelW - 24)
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink)
      .text(panel.lines[0], x + 12, panelY + 24, { width: panelW - 24 })
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.body)
      .text(panel.lines.slice(1).join('\n'), x + 12, panelY + 39, { width: panelW - 24, lineGap: 2 })
  })

  doc.y = panelY + panelH + 12

  // Period strip
  const stripY = doc.y
  const stripH = 34
  doc.rect(left, stripY, width, stripH).fillAndStroke(COLORS.panel, COLORS.border)
  ;[
    ['Period start', fmtDate(data.period.start)],
    ['Period end', fmtDate(data.period.end)],
    ['Pay date', fmtDate(data.period.payDate)],
    ['Currency', cur],
  ].forEach(([l, v], i, arr) => {
    const cw = width / arr.length
    const x = left + i * cw
    if (i > 0) doc.moveTo(x, stripY + 7).lineTo(x, stripY + stripH - 7).strokeColor(COLORS.border).lineWidth(0.6).stroke()
    label(l, x + 12, stripY + 8, cw - 24)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.ink).text(v, x + 12, stripY + 18, { width: cw - 24 })
  })

  doc.y = stripY + stripH + 18

  // Table helper: columns as [label, width, align]
  function table(title, cols, rows) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.ink)
      .text(title.toUpperCase(), left, doc.y, { width, characterSpacing: 0.6 })
    doc.y += 12
    const headY = doc.y
    doc.rect(left, headY, width, 16).fill(COLORS.ink)
    let x = left
    cols.forEach(([l, w, align]) => {
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF')
        .text(l.toUpperCase(), x + 8, headY + 5, { width: w - 16, align: align ?? 'left' })
      x += w
    })
    doc.y = headY + 16
    rows.forEach((row, ri) => {
      const rowY = doc.y
      const rowH = 17
      if (ri % 2 === 1) doc.rect(left, rowY, width, rowH).fill(COLORS.panel)
      let cx = left
      row.forEach((cell, ci) => {
        const [, w, align] = cols[ci]
        doc.font(ci === 0 ? 'Helvetica' : 'Helvetica').fontSize(8.5).fillColor(COLORS.body)
          .text(cell, cx + 8, rowY + 5, { width: w - 16, align: align ?? 'left' })
        cx += w
      })
      doc.y = rowY + rowH
      hr(doc.y, COLORS.line, 0.4)
    })
  }

  const w = [width * 0.40, width * 0.13, width * 0.13, width * 0.17, width * 0.17]
  table(
    'Earnings',
    [['Description', w[0]], ['Rate', w[1], 'right'], ['Units', w[2], 'right'], ['Current', w[3], 'right'], ['Year to date', w[4], 'right']],
    data.earnings.map((e) => [
      e.description,
      e.rate == null ? '—' : money(e.rate, cur),
      e.units == null ? '—' : String(e.units),
      money(e.amountCents, cur),
      e.ytdCents == null ? '—' : money(e.ytdCents, cur),
    ]),
  )

  doc.y += 14

  if (data.payee.classification === 'employee') {
    table(
      'Taxes and deductions',
      [['Description', w[0] + w[1] + w[2]], ['Current', w[3], 'right'], ['Year to date', w[4], 'right']],
      (data.deductions ?? []).map((d) => [d.description, money(d.amountCents, cur), d.ytdCents == null ? '—' : money(d.ytdCents, cur)]),
    )
  } else {
    const noteY = doc.y
    doc.roundedRect(left, noteY, width, 40, 5).fillAndStroke('#FFFFFF', COLORS.border)
    label('Taxes and deductions', left + 12, noteY + 10, width - 24)
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.body).text(
      'None withheld. Payments are made to an independent contractor, who is responsible for their own taxes and social contributions in their country of residence. This statement does not evidence U.S. employment.',
      left + 12, noteY + 21, { width: width - 24, lineGap: 1.5 },
    )
    doc.y = noteY + 40
  }

  doc.y += 16

  // Summary strip
  const sumY = doc.y
  const sumH = 46
  doc.rect(left, sumY, width, sumH).fillAndStroke(COLORS.panel, COLORS.border)
  const cells = [
    ['Gross pay', money(t.grossCents, cur), t.grossYtdCents == null ? null : money(t.grossYtdCents, cur)],
    ['Deductions', money(t.deductionsCents, cur), t.deductionsYtdCents == null ? null : money(t.deductionsYtdCents, cur)],
    ['Net pay', money(t.netCents, cur), null],
  ]
  cells.forEach(([l, v, ytd], i) => {
    const cw = width / cells.length
    const x = left + i * cw
    const last = i === cells.length - 1
    if (last) doc.rect(x, sumY, cw, sumH).fillAndStroke(COLORS.ink, COLORS.ink)
    else if (i > 0) doc.moveTo(x, sumY + 8).lineTo(x, sumY + sumH - 8).strokeColor(COLORS.border).lineWidth(0.6).stroke()
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(last ? COLORS.accent : COLORS.muted)
      .text(l.toUpperCase(), x + 12, sumY + 10, { width: cw - 24, characterSpacing: 0.4 })
    doc.font('Helvetica-Bold').fontSize(last ? 15 : 12).fillColor(last ? '#FFFFFF' : COLORS.ink)
      .text(v, x + 12, sumY + 22, { width: cw - 24 })
    if (ytd) doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted).text(`YTD ${ytd}`, x + cw - 90, sumY + 28, { width: 78, align: 'right' })
  })

  doc.y = sumY + sumH + 16

  // Direct deposit
  if (data.deposit?.last4) {
    const depY = doc.y
    doc.roundedRect(left, depY, width, 42, 5).fillAndStroke('#FFFFFF', COLORS.border)
    label('Direct deposit', left + 12, depY + 10, width - 24)
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.ink).text(
      `${data.deposit.bankName} · ${data.deposit.accountType} account ••••${data.deposit.last4}`,
      left + 12, depY + 22, { width: width * 0.6 },
    )
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink)
      .text(money(t.netCents, cur), left + width * 0.6, depY + 21, { width: width * 0.4 - 12, align: 'right' })
    doc.y = depY + 42 + 14
  }

  ;(data.notes ?? []).forEach((n) => {
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.body).text(n, left, doc.y, { width, lineGap: 2 })
    doc.y += 4
  })

  // Footer
  const footerY = doc.page.height - MARGIN - 46
  hr(footerY, COLORS.rule, 0.5)
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.muted)
    .text('THIS STATEMENT IS NOT A CHECK AND IS NON-NEGOTIABLE.', left, footerY + 9, { width, align: 'center', characterSpacing: 0.4 })
  doc.font('Helvetica').fontSize(6.8).fillColor('#999999').text(
    `Issued by ${data.employer.name} — retain for your records. Amounts reflect payments actually disbursed for the period shown.`,
    left, footerY + 22, { width, align: 'center', lineGap: 1.5 },
  )

  doc.end()
  return new Promise((resolve) => stream.on('finish', () => resolve(outputPath)))
}

// ── Self-check: `node scripts/generate-paystub.mjs --check` ──────────────────
function selfCheck() {
  assert.equal(money(0), '$0.00')
  assert.equal(money(123456789), '$1,234,567.89')
  assert.equal(money(-500, 'BRL'), '-R$ 5.00')

  const employee = {
    earnings: [{ amountCents: 500000, ytdCents: 4000000 }],
    deductions: [{ amountCents: 31000, ytdCents: 248000 }, { amountCents: 7250, ytdCents: 58000 }],
  }
  const t = totals(employee)
  assert.equal(t.grossCents, 500000)
  assert.equal(t.deductionsCents, 38250)
  assert.equal(t.netCents, 461750)

  // net can never exceed gross
  assert.throws(() => totals({ earnings: [{ amountCents: 100 }], deductions: [{ amountCents: 200 }] }), /net pay negative/)

  // contractor statement must not carry withholding
  const base = {
    payee: { name: 'X', classification: 'contractor' },
    period: { payDate: '2026-09-05' },
    earnings: [{ amountCents: 1 }],
  }
  assert.throws(() => validate({ ...base, deductions: [{ description: 'FICA', amountCents: 1 }] }), /no U.S. tax withholding/)
  validate({ ...base, deductions: [] })

  // full account numbers are rejected outright
  assert.throws(() => validate({ ...base, deposit: { last4: '123456789' } }), /exactly 4 digits/)

  const noYtd = totals({ earnings: [{ amountCents: 300000 }], deductions: [] })
  assert.equal(noYtd.grossYtdCents, null, 'absent YTD must stay absent, never render as $0.00')
  assert.equal(noYtd.netCents, 300000)

  console.log('self-check ok')
}

const arg = process.argv[2]
if (arg === '--check') {
  selfCheck()
} else {
  const dataPath = arg
    ? path.resolve(arg)
    : [path.join(__dirname, 'paystub.data.json'), path.join(__dirname, 'paystub.data.example.json')].find(fs.existsSync)
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  validate(data)
  const outputPath = path.join(root, 'docs', `paystub-${data.period.statementNo}.pdf`)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  render(data, outputPath).then((p) => console.log(`PDF gerado: ${p}\nFonte: ${dataPath}`))
}
