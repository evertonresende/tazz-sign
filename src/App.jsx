import { Route, Routes } from 'react-router-dom'
import VerifyPage from './pages/VerifyPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/:signatureId" element={<VerifyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
