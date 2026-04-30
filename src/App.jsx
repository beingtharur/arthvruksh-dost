import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ChatPage from './pages/ChatPage.jsx'
import LearnPage from './pages/LearnPage.jsx'
import FaqPage from './pages/FaqPage.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/faq" element={<FaqPage />} />
      </Routes>
    </Layout>
  )
}
