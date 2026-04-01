import './App.css'
import { Routes, Route } from "react-router-dom"
import AuthContainer from "./features/auth/AuthContainer"
import MeasurePage from "./features/measurement/pages/MeasurePage"
import DoctorWorkspace from './features/measurement/pages/DoctorWorkspace'

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
