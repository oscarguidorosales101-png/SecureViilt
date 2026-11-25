// ==============================================================================
// SECUREVAULT - RESTABLECIMIENTO DE CONTRASEÑA CON TOKEN CRIPTOGRÁFICO
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import styles from './AuthStyles.module.css';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const isPolicyMet = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!token.trim()) {
      setErrorMessage('Token de recuperación no provisto o inválido.');
      return;
    }

    if (!isPolicyMet) {
      setErrorMessage('La nueva contraseña debe cumplir con todos los requisitos de complejidad.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccessMessage('¡Contraseña actualizada con éxito! Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (error) {
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error.message || 'Error al restablecer contraseña.');
      } else {
        setErrorMessage('Token inválido o expirado.');
      }
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
      </header>

      <main className={styles.authBody}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>New Password</h1>
          <p className={styles.authSubtitle}>Define tu nueva contraseña de acceso seguro.</p>

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
            {!searchParams.get('token') && (
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="token">Token Criptográfico</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="token"
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="Pega el token recibido por correo"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="newPassword">Nueva Contraseña</label>
              <div className={styles.inputWrapper}>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={styles.inputField}
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <ul className={styles.passwordHintList}>
                <li className={`${styles.passwordHintItem} ${hasMinLength ? styles.validHint : ''}`}>
                  <CheckCircle2 size={12} /> Mínimo 8 caracteres
                </li>
                <li className={`${styles.passwordHintItem} ${hasUppercase && hasLowercase ? styles.validHint : ''}`}>
                  <CheckCircle2 size={12} /> Mayúsculas y minúsculas
                </li>
                <li className={`${styles.passwordHintItem} ${hasNumber && hasSymbol ? styles.validHint : ''}`}>
                  <CheckCircle2 size={12} /> Al menos un número y un símbolo especial
                </li>
              </ul>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={styles.inputField}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !isPolicyMet}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Actualizando contraseña...
                </>
              ) : (
                'Restablecer Contraseña'
              )}
            </button>
          </form>

          <div className={styles.forgotLinkWrapper} style={{ marginTop: '1.75rem' }}>
            <Link to="/login" className={styles.forgotLink}>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
