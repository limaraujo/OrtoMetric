import './App.css'
import { Routes, Route } from "react-router-dom"
import AuthContainer from "./pages/AuthContainer"
import MeasurePage from "./pages/MeasurePage"
import DoctorWorkspace from './pages/DoctorWorkspace'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthContainer />} />
      <Route path="/login" element={<AuthContainer />} />
      <Route path="/dashboard" element={<DoctorWorkspace />} />
      <Route path="/measure" element={<MeasurePage />} />

    </Routes>
  )
}