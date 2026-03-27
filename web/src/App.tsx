import './App.css'
import { Routes, Route } from "react-router-dom"
import AuthContainer from "./pages/AuthContainer"
import DoctorDashboardPage from "./pages/DoctorDashboardPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DoctorDashboardPage />} />
      <Route path="/login" element={<AuthContainer />} />
      <Route path="/dashboard" element={<DoctorDashboardPage />} />
    </Routes>
  )
}