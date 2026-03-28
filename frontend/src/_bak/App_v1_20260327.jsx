import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Enrich from './pages/Enrich'
import Feeds from './pages/Feeds'
import Actors from './pages/Actors'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 p-6 max-w-[1400px]">
          <Routes>
            <Route path="/" element={<Enrich />} />
            <Route path="/feeds" element={<Feeds />} />
            <Route path="/actors" element={<Actors />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
