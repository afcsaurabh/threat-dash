import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Enrich from './pages/Enrich'
import Feeds from './pages/Feeds'
import News from './pages/News'
import Actors from './pages/Actors'
import Reports from './pages/Reports'

// basename keeps React Router in sync with the Vite base path on GitHub Pages.
const basename = import.meta.env.BASE_URL ?? '/'

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <div className="flex min-h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/enrich" element={<Enrich />} />
            <Route path="/feeds" element={<Feeds />} />
            <Route path="/news" element={<News />} />
            <Route path="/actors" element={<Actors />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
