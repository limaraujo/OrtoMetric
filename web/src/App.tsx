import './App.css'
import { Routes, Route } from "react-router-dom"
import Interface from "./pages/Interface"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Interface />} />
    </Routes>
  )
}