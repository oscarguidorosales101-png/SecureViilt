// ==============================================================================
// SECUREVAULT - SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA (ANTI-ENUMERACIÓN)
// ==============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import styles from './AuthStyles.module.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await authService.forgotPassword(email);
      setSuccessMessage(response.message || 'Si la cuenta existe, recibirás un correo de recuperación.');
    } catch {
      setErrorMessage('No se pudo procesar la solicitud. Por favor intenta más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <header className={styles.authHeader}>
        <div className={styles.brand}>
          <Shield className={styles.brandIcon} size={28} />
          <div>
            <span>SecureVault</span>
            <span className={styles.brandSubtext}>Zero-Trust Storage</span>
          </div>
        </div>
        <Link to="/login" className={styles.headerActionBtn}>
          Back to Login
        </Link>
      </header>

      <main className={styles.authBody}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Reset Password</h1>
          <p className={styles.authSubtitle}>
            Ingresa tu correo para recibir un enlace criptográfico temporal de recuperación.
          </p>

          {errorMessage && (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  required
                  className={styles.inputField}
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando solicitud...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className={styles.forgotLinkWrapper} style={{ marginTop: '1.75rem' }}>
            <Link to="/login" className={styles.forgotLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
