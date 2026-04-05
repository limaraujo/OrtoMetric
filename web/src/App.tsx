import './App.css'
import { Suspense, lazy } from 'react'
import { Routes, Route } from "react-router-dom"
import AuthContainer from "./features/auth/AuthContainer"
import { Header } from './components/Header'
const MeasurePage = lazy(() => import("./features/measurement/pages/MeasurePage"))
const DoctorWorkspace = lazy(() => import('./features/measurement/pages/DoctorWorkspace'))

export default function App() {

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <Header />
      <Suspense
        fallback={<div className="flex flex-1 items-center justify-center bg-background text-sm text-muted-foreground">
          Carregando interface...
        </div>}
      >
        <main className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<AuthContainer />} />
            <Route path="/login" element={<AuthContainer />} />
            <Route path="/dashboard" element={<DoctorWorkspace />} />
            <Route path="/measure" element={<MeasurePage />} />
          </Routes>
        </main>
      </Suspense>
      <footer className="h-12 border-t border-border bg-card/50 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">
          OrtoMetric © {new Date().getFullYear()} - Ferramenta de medições radiológicas
        </p>
      </footer>
    </div>
  )
}
