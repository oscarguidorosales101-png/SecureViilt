// ==============================================================================
// SECUREVAULT - MODAL DE CONFIRMACIÓN DE CONTRASEÑA PARA REVELADO SEGURO
// ==============================================================================

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import styles from './RevealPasswordModal.module.css';

export const RevealPasswordModal = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Debes ingresar tu contraseña para verificar la identidad.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Contraseña incorrecta.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.lockIconBox}>
            <Lock size={20} />
          </div>
          <h2 className={styles.modalTitle}>Verificación de Seguridad</h2>
        </div>

        <p className={styles.modalSubtitle}>
          Para descifrar y revelar tus datos confidenciales en memoria, ingresa tu contraseña de acceso.
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="confirmVaultPassword">
              Contraseña de Usuario
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmVaultPassword"
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                className={styles.inputField}
                placeholder="Ingresa tu contraseña..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setPassword('');
                setError('');
                onClose();
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.confirmBtn}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Descifrando...
                </>
              ) : (
                'Confirmar y Revelar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
