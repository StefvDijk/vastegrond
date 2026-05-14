import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './lib/auth'
import { AppShell } from './routes/AppShell'
import { AuthGuard } from './routes/AuthGuard'
import { Overview } from './routes/Overview'
import { Menu } from './routes/Menu'
import { Dishes } from './routes/Dishes'
import { Ingredients } from './routes/Ingredients'
import { Shopping } from './routes/Shopping'
import { Guests } from './routes/Guests'
import { Finance } from './routes/Finance'
import { Settings } from './routes/Settings'
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
                <Route path="/overview" element={<Overview />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/dishes" element={<Dishes />} />
                <Route path="/ingredients" element={<Ingredients />} />
                <Route path="/shopping" element={<Shopping />} />
                <Route path="/guests" element={<Guests />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/settings" element={<Settings />} />
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
