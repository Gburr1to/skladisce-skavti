import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { BorrowProvider } from './context/BorrowContext';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import WarehouseRoomPage from './pages/WarehouseRoomPage';
import ClosetPage from './pages/ClosetPage';
import ShelfPage from './pages/ShelfPage';
import AllArticlesPage from './pages/AllArticlesPage';
import BorrowingsPage from './pages/BorrowingsPage';
import KeyHoldersPage from './pages/KeyHoldersPage';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <BorrowProvider>
          <Routes>
            {/* Prijava (javna pot) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Zaščitene poti skladišča znotraj enotnega Layouta */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WarehouseRoomPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/omara/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClosetPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/polica/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ShelfPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/artikli"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AllArticlesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/izposoje"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BorrowingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/kljuci"
              element={
                <ProtectedRoute>
                  <Layout>
                    <KeyHoldersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Preusmeritev vseh neznanih poti na domačo stran */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BorrowProvider>
      </AuthProvider>
    </Router>
  );
}
