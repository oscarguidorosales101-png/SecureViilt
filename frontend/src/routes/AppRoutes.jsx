// ==============================================================================
// SECUREVAULT - ENRUTADOR PRINCIPAL DE LA APLICACIÓN
// ==============================================================================

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { PublicRoute } from './PublicRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Páginas de Autenticación
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// Páginas Principales
import { NotesDashboardPage } from '../pages/dashboard/NotesDashboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';

export const AppRoutes = () => {
  // Estado compartido para búsqueda, etiquetas y modal entre Sidebar/Header y Dashboard
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagsList, setTagsList] = useState([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  return (
    <Routes>
      {/* Rutas Públicas (Protegidas para no autenticados) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Rutas Autenticadas con Layout Maestro */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout
              onNewNote={() => setIsNoteModalOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              tagsList={tagsList}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <NotesDashboardPage
              searchQuery={searchQuery}
              selectedTag={selectedTag}
              onTagsComputed={setTagsList}
              isModalOpen={isNoteModalOpen}
              setIsModalOpen={setIsNoteModalOpen}
            />
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
