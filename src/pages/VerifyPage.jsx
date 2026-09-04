import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import VerificationAnimation from '../components/VerificationAnimation'
import { DOCUMENT, SIGNATURE_ID, VERIFY_BASE_URL } from '../shared/signature'
import { findStatement } from '../shared/statements'
import './VerifyPage.css'

const money = (cents, currency) => {
  const symbol = currency === 'BRL' ? 'R$ ' : '$'
  const int = String(Math.floor(Math.abs(cents) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${symbol}${int}.${String(Math.abs(cents) % 100).padStart(2, '0')}`
}

const date = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Campos exibidos por tipo de documento — o que um terceiro precisa pra conferir o papel. */
function fieldsFor(statement, id) {
  if (statement?.type === 'paystub') {
    const isEmployee = statement.classification === 'employee'
    return {
      heading: 'Demonstrativo de pagamento válido',
      subtitle: `Este demonstrativo consta no registro de documentos emitidos pela ${statement.issuer.replace(/\.$/, '')}. Confira abaixo se os dados batem com o papel em mãos.`,
      rows: [
        ['Documento', isEmployee ? 'Earnings statement' : 'Contractor payment statement'],
        ['Nº do demonstrativo', statement.statementNo],
        ['Recebedor', statement.payeeName],
        ['Período', `${date(statement.periodStart)} a ${date(statement.periodEnd)}`],
        ['Data de pagamento', date(statement.payDate)],
        ['Bruto', `${money(statement.grossCents, statement.currency)} ${statement.currency}`],
        ...(isEmployee ? [['Deduções', `${money(statement.deductionsCents, statement.currency)} ${statement.currency}`]] : []),
        ['Líquido', `${money(statement.netCents, statement.currency)} ${statement.currency}`],
        ['Emitido em', date(statement.issuedAt)],
        ['ID de verificação', id],
      ],
      digest: statement.sha256,
      note: isEmployee
        ? null
        : 'Pagamento a prestador de serviço autônomo. Não há retenção de imposto norte-americano e o documento não comprova vínculo empregatício nos EUA.',
    }
  }

  // Documento legado: declaração de vínculo e renda
  return {
    heading: 'Assinatura digital válida',
    subtitle:
      'Este documento foi emitido e assinado digitalmente pela TAZZ Inc. A integridade da assinatura foi confirmada com sucesso.',
    rows: [
      ['Documento', DOCUMENT.title],
      ['Titular', `${DOCUMENT.employeeName} — CPF ${DOCUMENT.cpf}`],
      ['Emitido em', DOCUMENT.issuedAt],
      ['Assinado por', `${DOCUMENT.ceoName}, ${DOCUMENT.ceoTitle}`],
      ['ID de verificação', id],
    ],
    digest: null,
    note: null,
  }
}

export default function VerifyPage() {
  const { signatureId } = useParams()
  const statement = findStatement(signatureId)
  const valid = Boolean(statement) || signatureId === SIGNATURE_ID
  const [phase, setPhase] = useState(valid ? 'checking' : 'invalid')

  useEffect(() => {
    if (!valid) {
      setPhase('invalid')
      return
    }

    const timer = window.setTimeout(() => setPhase('valid'), 2200)
    return () => window.clearTimeout(timer)
  }, [valid])

  const verifyUrl = `${VERIFY_BASE_URL}/${signatureId}`
  const view = valid ? fieldsFor(statement, signatureId) : null

  return (
    <main className="verify">
      <div className="verify__glow" aria-hidden="true" />

      <section className="verify__card">
        <VerificationAnimation phase={phase} />

        {phase === 'valid' && (
          <div className="verify__details">
            <p className="verify__badge">Documento autêntico</p>
            <h1>{view.heading}</h1>
            <p className="verify__subtitle">{view.subtitle}</p>

            <dl className="verify__meta">
              {view.rows.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd className={term === 'ID de verificação' ? 'verify__mono' : undefined}>{value}</dd>
                </div>
              ))}
            </dl>

            {view.digest && (
              <div className="verify__digest">
                <p>
                  Impressão digital SHA-256 do arquivo original. Confira o PDF que você recebeu — qualquer
                  alteração muda este valor por completo:
                </p>
                <code className="verify__mono">{view.digest}</code>
                <p className="verify__digest-how">
                  macOS e Linux: <code>shasum -a 256 arquivo.pdf</code> · Windows:{' '}
                  <code>certutil -hashfile arquivo.pdf SHA256</code>
                </p>
              </div>
            )}

            {view.note && <p className="verify__note">{view.note}</p>}

            <p className="verify__url">
              URL verificada: <span>{verifyUrl}</span>
            </p>
          </div>
        )}

        {phase === 'invalid' && (
          <div className="verify__details verify__details--invalid">
            <h1>Documento não encontrado</h1>
            <p className="verify__subtitle">
              O identificador informado não corresponde a nenhum documento registrado no sistema
              TAZZ. Verifique o link impresso no documento original.
            </p>
            <p className="verify__mono">{signatureId}</p>
          </div>
        )}
      </section>

      <footer className="verify__footer">
        <p>
          TAZZ services in Brazil are operated by TAZZ Brasil Ltda. The TAZZ brand and certain
          technology components are used under license from TAZZ Inc. (USA).
        </p>
      </footer>
    </main>
  )
}
