// ==============================================================================
// SECUREVAULT - GESTIÓN DE PERFIL Y BÓVEDA DE SECRETOS (ESTILO CLASPT)
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Smartphone,
  CreditCard,
  FileKey,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { RevealPasswordModal } from '../../components/profile/RevealPasswordModal';
import styles from './ProfilePage.module.css';

export const ProfilePage = () => {
  const { user, isAdmin } = useAuth();

  const [sensitiveData, setSensitiveData] = useState(null);
  const [revealedData, setRevealedData] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario de edición
  const [phoneInput, setPhoneInput] = useState('');
  const [nationalIdInput, setNationalIdInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Cargar datos sensibles (inicialmente enmascarados desde el backend)
  const fetchSensitiveData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profileService.getSensitiveData();
      setSensitiveData(data);
      if (data && data.hasData) {
        setPhoneInput(data.phoneNumber || '');
        setNationalIdInput(data.nationalId || '');
        setNotesInput(data.customNotes || '');
      }
    } catch (err) {
      console.error('Error fetching sensitive data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensitiveData();
  }, [fetchSensitiveData]);

  // Manejador de confirmación con contraseña para revelado seguro (RF-05)
  const handleConfirmReveal = async (password) => {
    const data = await profileService.revealSensitiveData(password);
    setRevealedData(data);
    setIsRevealed(true);
  };

  // Re-ocultar los datos
  const handleLockSecrets = () => {
    setIsRevealed(false);
    setRevealedData(null);
  };

  // Guardar datos sensibles con cifrado AES-256-GCM
  const handleSaveData = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      await profileService.saveSensitiveData({
        phoneNumber: phoneInput.trim() || null,
        nationalId: nationalIdInput.trim() || null,
        customNotes: notesInput.trim() || null,
      });
      setSaveSuccess('Datos sensibles cifrados y guardados exitosamente con AES-256-GCM.');
      setIsRevealed(false);
      setRevealedData(null);
      await fetchSensitiveData();
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Error al guardar los datos sensibles.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitial = (email) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <span>Cargando bóveda de seguridad...</span>
      </div>
    );
  }

  // Valores a mostrar (revelados o enmascarados)
  const displayPhone = isRevealed && revealedData
    ? revealedData.phoneNumber || 'No configurado'
    : sensitiveData?.phoneNumber || 'No configurado';

  const displayNationalId = isRevealed && revealedData
    ? revealedData.nationalId || 'No configurado'
    : sensitiveData?.nationalId || 'No configurado';

  const displayCustomNotes = isRevealed && revealedData
    ? revealedData.customNotes || 'Sin notas privadas adicionales'
    : sensitiveData?.customNotes || '••••••••••••';

  return (
    <div className={styles.profileContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <ShieldCheck size={28} className="text-blue-500" />
          <span>Profile & Sensitive Vault</span>
        </h1>
        <p className={styles.pageSubtitle}>
          Gestiona tu identidad y tus secretos cifrados con AES-256-GCM y enmascaramiento determinístico.
        </p>
      </header>

      {/* 1. Tarjeta de Identidad */}
      <div className={styles.identityCard}>
        <div className={styles.identityInfo}>
          <div className={styles.avatarLarge}>
            {getInitial(user?.email)}
          </div>
          <div>
            <div className={styles.userEmailTitle}>{user?.email}</div>
            <div className={styles.userRoleMeta}>
              <span className={`badge ${isAdmin ? 'badge-purple' : 'badge-blue'}`}>
                {user?.role || 'USER'}
              </span>
              <span className="badge badge-emerald">
                Cuenta Activa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sección de Secretos estilo Claspt (Attachment 3) */}
      <section className={styles.secretsVaultCard}>
        <div className={styles.vaultHeaderRow}>
          <div className={styles.vaultTitle}>
            {isRevealed ? <Unlock size={18} className="text-emerald-400" /> : <Lock size={18} />}
            <span>SECRETS CONTAINER ({isRevealed ? 'REVEALED IN-MEMORY' : 'MASKED / ENCRYPTED'})</span>
          </div>

          {isRevealed ? (
            <button className={styles.lockAllBtn} onClick={handleLockSecrets}>
              <EyeOff size={14} />
              <span>Ocultar Secretos</span>
            </button>
          ) : (
            <button
              className={styles.revealPillBtn}
              onClick={() => setIsModalOpen(true)}
            >
              <Eye size={14} />
              <span>Click to Reveal All</span>
            </button>
          )}
        </div>

        <div className={styles.secretsList}>
          {/* Secreto 1: Teléfono */}
          <div className={styles.secretItemBar}>
            <div className={styles.secretLeft}>
              <Smartphone className={styles.secretIcon} size={20} />
              <div>
                <div className={styles.secretName}>Teléfono Personal</div>
                <div className={`${styles.secretValue} ${isRevealed ? styles.secretValueRevealed : ''}`}>
                  {displayPhone}
                </div>
              </div>
            </div>

            {!isRevealed && (
              <button
                className={styles.revealPillBtn}
                onClick={() => setIsModalOpen(true)}
              >
                Click to reveal
              </button>
            )}
          </div>

          {/* Secreto 2: Identificación / Cédula */}
          <div className={styles.secretItemBar}>
            <div className={styles.secretLeft}>
              <CreditCard className={styles.secretIcon} size={20} />
              <div>
                <div className={styles.secretName}>Documento Nacional de Identidad / Cédula</div>
                <div className={`${styles.secretValue} ${isRevealed ? styles.secretValueRevealed : ''}`}>
                  {displayNationalId}
                </div>
              </div>
            </div>

            {!isRevealed && (
              <button
                className={styles.revealPillBtn}
                onClick={() => setIsModalOpen(true)}
              >
                Click to reveal
              </button>
            )}
          </div>

          {/* Secreto 3: Notas Privadas de Acceso */}
          <div className={styles.secretItemBar}>
            <div className={styles.secretLeft}>
              <FileKey className={styles.secretIcon} size={20} />
              <div>
                <div className={styles.secretName}>Credenciales / Notas Secretas</div>
                <div className={`${styles.secretValue} ${isRevealed ? styles.secretValueRevealed : ''}`}>
                  {displayCustomNotes}
                </div>
              </div>
            </div>

            {!isRevealed && (
              <button
                className={styles.revealPillBtn}
                onClick={() => setIsModalOpen(true)}
              >
                Click to reveal
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Formulario para Actualizar Datos Sensibles */}
      <section className={styles.editSensitiveFormCard}>
        <h2 className={styles.formTitle}>Actualizar Bóveda de Datos Sensibles</h2>
        <p className={styles.formSubtitle}>
          Los valores serán cifrados inmediatamente con AES-256-GCM y almacenados de forma segura en PostgreSQL.
        </p>

        {saveSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveData}>
          <div className={styles.formGrid}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Número Telefónico
              </label>
              <input
                type="text"
                placeholder="+506 8888-1234"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Cédula / Documento de Identidad
              </label>
              <input
                type="text"
                placeholder="1-1234-0567"
                value={nationalIdInput}
                onChange={(e) => setNationalIdInput(e.target.value)}
              />
            </div>

            <div className={styles.fullWidth}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                Notas Privadas / Claves de Recuperación de Emergencia
              </label>
              <textarea
                rows={3}
                placeholder="PINs secretos, códigos de respaldo o notas de seguridad..."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitSensitiveBtn}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Cifrando y guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar en Bóveda Cifrada
              </>
            )}
          </button>
        </form>
      </section>

      {/* Modal de confirmación de contraseña para revelado seguro */}
      <RevealPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmReveal}
      />
    </div>
  );
};
