import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'

// الصفحات
import OverviewPage from './pages/OverviewPage'
import WhatsAppPage from './pages/WhatsAppPage'
import ProductsPage from './pages/ProductsPage'
import ExpensesPage from './pages/ExpensesPage'
import POSPage from './pages/POSPage'
import ClientsPage from './pages/ClientsPage'
import SalesPage from './pages/SalesPage'

// الأنيميشن العام للصفحات
import { AnimatePresence } from 'framer-motion'
import PageWrapper from './ui/anim/PageWrapper'

// الخلفية المتحركة
import AppBackground from './ui/theme/AppBackground'

function WrapSurface({ children, className = "" }) {
  return <div className={`page-surface ${className}`}>{children}</div>
}

function RoutedPages() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/overview" replace />} />

        <Route path="/overview" element={
          <PageWrapper><WrapSurface><OverviewPage /></WrapSurface></PageWrapper>
        }/>

        <Route path="/whatsapp" element={
          <PageWrapper><WrapSurface className="whatsapp-page"><WhatsAppPage /></WrapSurface></PageWrapper>
        }/>

        <Route path="/products" element={
          <PageWrapper><WrapSurface><ProductsPage /></WrapSurface></PageWrapper>
        }/>

        <Route path="/expenses" element={
          <PageWrapper><WrapSurface><ExpensesPage /></WrapSurface></PageWrapper>
        }/>

        <Route path="/pos" element={
          <PageWrapper><WrapSurface><POSPage /></WrapSurface></PageWrapper>
        }/>

        <Route path="/clients" element={
          <PageWrapper><WrapSurface className="clients-page"><ClientsPage /></WrapSurface></PageWrapper>
        }/>

        <Route path="/sales" element={
          <PageWrapper><WrapSurface><SalesPage /></WrapSurface></PageWrapper>
        }/>

        <Route path="*" element={
          <PageWrapper><div className="p-6 text-mute">Not Found</div></PageWrapper>
        }/>
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppBackground>
        <div className="min-h-screen relative">
          <Layout className="motion-ready">
            <RoutedPages />
          </Layout>
        </div>
      </AppBackground>
    </BrowserRouter>
  )
}
