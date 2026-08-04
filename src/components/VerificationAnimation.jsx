import './VerificationAnimation.css'

const STATUS = {
  checking: {
    label: 'Verificando assinatura digital…',
    hint: 'Validando integridade e autenticidade do documento',
  },
  valid: {
    label: 'Assinatura confirmada',
    hint: 'Documento íntegro e emitido pela TAZZ Inc.',
  },
  invalid: {
    label: 'Verificação não concluída',
    hint: 'Identificador inválido ou documento não registrado',
  },
}

export default function VerificationAnimation({ phase }) {
  const status = STATUS[phase] ?? STATUS.checking

  return (
    <div className={`verification verification--${phase}`}>
      <div className="verification__logo-wrap" aria-hidden="true">
        <div className="verification__ring verification__ring--outer" />
        <div className="verification__ring verification__ring--inner" />
        <img src="/logo-tazz.png" alt="" className="verification__logo" />
        {phase === 'valid' && (
          <span className="verification__check">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
        {phase === 'invalid' && (
          <span className="verification__cross">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
      </div>

      <p className="verification__status">{status.label}</p>
      <p className="verification__hint">{status.hint}</p>

      {phase === 'checking' && (
        <div className="verification__progress" role="progressbar" aria-label="Verificando">
          <span />
        </div>
      )}
    </div>
  )
}
