import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const SIGNATURE_ID = '7c4e9a2b-1f8d-4e6a-b3c5-9d2e8f1a6b4c'
const VERIFY_URL = `https://sign.tazz.app/${SIGNATURE_ID}`

const DOCUMENT = {
  title: 'Declaração de Vínculo Empregatício e Comprovante de Renda',
  employeeName: 'Éverton Augusto Resende',
  cpf: '119.769.206-12',
  monthlyIncome: 'R$ 3.000,00 (três mil reais)',
  issuedAt: '04 de agosto de 2026',
  ceoName: 'Glauber Soares',
  ceoTitle: 'Chief Executive Officer — TAZZ Inc.',
}

const FOOTER_LEGAL =
  'TAZZ services in Brazil are operated by TAZZ Brasil Ltda. The TAZZ brand and certain technology components are used under license from TAZZ Inc. (a corporation, USA). TAZZ Inc. does not operate the service in Brazil. All rights reserved.'

const FOOTER_ADDRESS = [
  'Alameda Rio Negro 503 sl 2020',
  'Alphaville · Barueri SP',
  'CEP 06.454-000',
  'SAC: contact@tazz.app · Parcerias: contact@tazz.app · Imprensa: contact@tazz.app',
]

const outputPath = path.join(root, 'docs', 'comprovante-renda-everton-resende.pdf')
const logoPath = path.join(root, 'public', 'logo-tazz.png')

const doc = new PDFDocument({ size: 'A4', margin: 56 })
const stream = fs.createWriteStream(outputPath)
doc.pipe(stream)

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
const left = doc.page.margins.left

// Header
doc.image(logoPath, left, doc.y, { width: 110 })
doc
  .font('Helvetica-Bold')
  .fontSize(10)
  .fillColor('#666666')
  .text('TAZZ Inc. · Delaware, USA', left + pageWidth - 180, doc.y + 8, {
    width: 180,
    align: 'right',
  })

doc.moveDown(3)

doc.font('Helvetica-Bold').fontSize(18).fillColor('#0A0A0A').text(DOCUMENT.title, {
  align: 'left',
})

doc.moveDown(0.5)
doc
  .moveTo(left, doc.y)
  .lineTo(left + pageWidth, doc.y)
  .strokeColor('#C5FF3E')
  .lineWidth(2)
  .stroke()

doc.moveDown(1.2)

const body = `Pelo presente instrumento, a TAZZ Inc., sociedade empresarial constituída nos Estados Unidos da América e titular das tecnologias que sustentam a plataforma TAZZ, declara, para os devidos fins, que ${DOCUMENT.employeeName}, inscrito no CPF sob nº ${DOCUMENT.cpf}, encontra-se vinculado à organização na qualidade de colaborador contratado sob regime norte-americano de empregabilidade (U.S. employment framework), exercendo funções estratégicas de natureza técnica e operacional no ecossistema TAZZ.

O referido colaborador percebe remuneração mensal equivalente a ${DOCUMENT.monthlyIncome}, creditada de forma recorrente, conforme política interna de compensação da companhia.

Esta declaração é emitida a pedido do interessado, para fins de comprovação de vínculo empregatício e renda perante terceiros, especialmente instituições financeiras e imobiliárias, permanecendo válida enquanto mantido o vínculo descrito acima.`

doc.font('Helvetica').fontSize(11).fillColor('#1A1A1A').text(body, {
  align: 'justify',
  lineGap: 4,
})

doc.moveDown(1.5)

doc
  .font('Helvetica-Bold')
  .fontSize(11)
  .fillColor('#0A0A0A')
  .text(`Data de emissão: ${DOCUMENT.issuedAt}`)

doc.moveDown(2)

// Signature block
doc.font('Helvetica').fontSize(10).fillColor('#444444').text('Assinatura digital do responsável legal:')

doc.moveDown(0.8)

doc
  .font('Times-Italic')
  .fontSize(28)
  .fillColor('#111111')
  .text('Glauber Soares', left, doc.y, { lineBreak: false })

doc.moveDown(0.2)
doc
  .moveTo(left, doc.y)
  .lineTo(left + 220, doc.y)
  .strokeColor('#CCCCCC')
  .lineWidth(0.5)
  .stroke()

doc.moveDown(0.4)
doc.font('Helvetica-Bold').fontSize(10).fillColor('#0A0A0A').text(DOCUMENT.ceoName)
doc.font('Helvetica').fontSize(9).fillColor('#555555').text(DOCUMENT.ceoTitle)

doc.moveDown(1.2)

doc
  .roundedRect(left, doc.y, pageWidth, 72, 6)
  .fillAndStroke('#F7F7F7', '#E5E5E5')

const boxY = doc.y + 12
doc
  .font('Helvetica-Bold')
  .fontSize(8.5)
  .fillColor('#0A0A0A')
  .text('VERIFICAÇÃO DE AUTENTICIDADE', left + 14, boxY)

doc
  .font('Helvetica')
  .fontSize(8.5)
  .fillColor('#333333')
  .text(
    'Este documento possui assinatura digital verificável online. Acesse o link abaixo para confirmar a validade:',
    left + 14,
    boxY + 14,
    { width: pageWidth - 28 },
  )

doc
  .font('Helvetica-Bold')
  .fontSize(8.5)
  .fillColor('#2D5A00')
  .text(VERIFY_URL, left + 14, boxY + 38, { width: pageWidth - 28 })

doc
  .font('Helvetica')
  .fontSize(7.5)
  .fillColor('#666666')
  .text(`ID: ${SIGNATURE_ID}`, left + 14, boxY + 52)

doc.y = boxY + 72 + 24

// Footer
const footerY = doc.page.height - doc.page.margins.bottom - 72
doc
  .font('Helvetica')
  .fontSize(7)
  .fillColor('#888888')
  .text(FOOTER_LEGAL, left, footerY, { width: pageWidth, align: 'justify', lineGap: 2 })

doc.moveDown(0.5)
FOOTER_ADDRESS.forEach((line) => {
  doc.text(line, { width: pageWidth, align: 'center' })
})

doc.end()

stream.on('finish', () => {
  console.log(`PDF gerado: ${outputPath}`)
})
