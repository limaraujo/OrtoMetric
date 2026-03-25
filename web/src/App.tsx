import './App.css'
import { Routes, Route } from "react-router-dom"
import Interface from "./pages/Interface"
import AuthContainer from "./pages/AuthContainer"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Interface />} />
      <Route path="/login" element={<AuthContainer />} />
    </Routes>
  )
}