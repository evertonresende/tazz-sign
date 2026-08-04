import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import VerificationAnimation from '../components/VerificationAnimation'
import { DOCUMENT, SIGNATURE_ID, VERIFY_BASE_URL } from '../shared/signature'
import './VerifyPage.css'

const isValidId = (id) => id === SIGNATURE_ID

export default function VerifyPage() {
  const { signatureId } = useParams()
  const valid = isValidId(signatureId)
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

  return (
    <main className="verify">
      <div className="verify__glow" aria-hidden="true" />

      <section className="verify__card">
        <VerificationAnimation phase={phase} />

        {phase === 'valid' && (
          <div className="verify__details">
            <p className="verify__badge">Documento autêntico</p>
            <h1>Assinatura digital válida</h1>
            <p className="verify__subtitle">
              Este documento foi emitido e assinado digitalmente pela TAZZ Inc. A integridade da
              assinatura foi confirmada com sucesso.
            </p>

            <dl className="verify__meta">
              <div>
                <dt>Documento</dt>
                <dd>{DOCUMENT.title}</dd>
              </div>
              <div>
                <dt>Titular</dt>
                <dd>
                  {DOCUMENT.employeeName} — CPF {DOCUMENT.cpf}
                </dd>
              </div>
              <div>
                <dt>Emitido em</dt>
                <dd>{DOCUMENT.issuedAt}</dd>
              </div>
              <div>
                <dt>Assinado por</dt>
                <dd>
                  {DOCUMENT.ceoName}, {DOCUMENT.ceoTitle}
                </dd>
              </div>
              <div>
                <dt>ID de verificação</dt>
                <dd className="verify__mono">{signatureId}</dd>
              </div>
            </dl>

            <p className="verify__url">
              URL verificada: <span>{verifyUrl}</span>
            </p>
          </div>
        )}

        {phase === 'invalid' && (
          <div className="verify__details verify__details--invalid">
            <h1>Assinatura não encontrada</h1>
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
