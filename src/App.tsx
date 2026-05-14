import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './lib/auth'
import { AppShell } from './routes/AppShell'
import { AuthGuard } from './routes/AuthGuard'
import { Placeholder } from './routes/Placeholder'
import { Login } from './routes/Login'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AuthGuard />}>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="/overview" element={<Placeholder title="Overzicht" />} />
                <Route path="/menu" element={<Placeholder title="Menu" />} />
                <Route path="/dishes" element={<Placeholder title="Gerechten" />} />
                <Route
                  path="/ingredients"
                  element={<Placeholder title="Ingrediënten" />}
                />
                <Route
                  path="/shopping"
                  element={<Placeholder title="Boodschappenlijst" />}
                />
                <Route path="/guests" element={<Placeholder title="Gasten" />} />
                <Route path="/finance" element={<Placeholder title="Financieel" />} />
                <Route
                  path="/settings"
                  element={<Placeholder title="Instellingen" />}
                />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
