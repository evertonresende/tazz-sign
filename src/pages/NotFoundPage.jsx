import { Link } from 'react-router-dom'
import { SIGNATURE_ID } from '../shared/signature'
import './NotFoundPage.css'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <img src="/logo-tazz.png" alt="TAZZ" className="not-found__logo" />
      <h1>Verificação de assinatura</h1>
      <p>Informe o link completo impresso no documento para validar a assinatura digital.</p>
      <Link className="not-found__demo" to={`/${SIGNATURE_ID}`}>
        Ver documento de exemplo
      </Link>
    </main>
  )
}
