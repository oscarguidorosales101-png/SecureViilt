// ==============================================================================
// SECUREVAULT - LAYOUT MAESTRO (ESTILO ANCHOR / CLASPT)
// ==============================================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  FileText,
  Pin,
  Lock,
  Users,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './AppLayout.module.css';

export const AppLayout = ({ onNewNote, searchQuery, setSearchQuery, selectedTag, setSelectedTag, tagsList = [] }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitial = (email) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  const isNotesDashboard = location.pathname === '/dashboard';

  return (
    <div className={styles.layoutContainer}>
      {/* Barra lateral de navegación estilo Anchor */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Shield className={styles.brandLogo} size={26} />
          <span className={styles.brandName}>SecureVault</span>
        </div>

        {/* Botón "+ New Note" rápido */}
        <button
          className={styles.newNoteBtn}
          onClick={() => {
            if (!isNotesDashboard) {
              navigate('/dashboard', { state: { openNewModal: true } });
            } else if (onNewNote) {
              onNewNote();
            }
          }}
        >
          <Plus size={16} />
          <span>New Note</span>
        </button>

        {/* Navegación principal */}
        <nav className={styles.navSection}>
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `${styles.navItem} ${isActive && !selectedTag ? styles.navItemActive : ''}`
            }
            onClick={() => setSelectedTag && setSelectedTag(null)}
          >
            <div className={styles.navItemLeft}>
              <FileText size={17} />
              <span>All Notes</span>
            </div>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <div className={styles.navItemLeft}>
              <Lock size={17} />
              <span>Sensitive Vault</span>
            </div>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <div className={styles.navItemLeft}>
                <Users size={17} />
                <span>Administration</span>
              </div>
            </NavLink>
          )}

          {/* Sección de Etiquetas estilo Anchor */}
          {tagsList.length > 0 && isNotesDashboard && (
            <>
              <div className={styles.tagsHeader}>Tags</div>
              {tagsList.map((tagObj) => (
                <div
                  key={tagObj.tag}
                  className={`${styles.tagItem} ${selectedTag === tagObj.tag ? styles.tagItemActive : ''}`}
                  onClick={() => setSelectedTag && setSelectedTag(selectedTag === tagObj.tag ? null : tagObj.tag)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Tag size={13} style={{ opacity: 0.7 }} />
                    <span>#{tagObj.tag}</span>
                  </div>
                  <span className={styles.tagCount}>{tagObj.count}</span>
                </div>
              ))}
            </>
          )}
        </nav>

        {/* Pie de la barra lateral con perfil y Sign out */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {getInitial(user?.email)}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userEmail} title={user?.email}>
                {user?.email}
              </div>
              <div className={styles.userRole}>
                {isAdmin ? 'System Administrator' : 'Standard User'}
              </div>
            </div>
          </div>

          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Contenedor principal */}
      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search encrypted notes..."
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            />
            <span className={styles.searchShortcut}>⌘ K</span>
          </div>

          <div className={styles.topBarActions}>
            <div className={styles.securityBadge}>
              <CheckCircle2 size={13} />
              <span>AES-256-GCM Enforced</span>
            </div>
          </div>
        </header>

        <main className={styles.contentArea}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
