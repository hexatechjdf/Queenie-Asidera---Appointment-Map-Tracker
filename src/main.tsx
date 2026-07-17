import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { RepsProvider } from '@/features/users/components/RepsProvider'
import { App } from '@/app/App'
import '@/styles/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <RepsProvider>
        <App />
      </RepsProvider>
    </AuthProvider>
  </StrictMode>,
)
