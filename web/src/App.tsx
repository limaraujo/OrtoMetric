import './App.css'
import { Routes, Route } from "react-router-dom"
import Interface from "./pages/Interface"
import Login from "./pages/Login"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Interface />} />
      <Route path="/Login" element={<Login />} />
    </Routes>
  )
}