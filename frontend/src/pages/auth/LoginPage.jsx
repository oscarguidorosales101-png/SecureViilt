// ==============================================================================
// SECUREVAULT - PÁGINA DE INICIO DE SESIÓN (ESTILO SECURITYTRAILS)
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthStyles.module.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error.message || 'Error de autenticación');
      } else {
        setErrorMessage('No se pudo conectar con el servidor seguro.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      {/* Encabezado superior tipo SecurityTrails */}
      <header className={styles.authHeader}>
        <div className={styles.brand}>
          <Shield className={styles.brandIcon} size={28} />
          <div>
            <span>SecureVault</span>
            <span className={styles.brandSubtext}>Zero-Trust Storage</span>
          </div>
        </div>
        <Link to="/register" className={styles.headerActionBtn}>
          Signup for Free
        </Link>
      </header>

      {/* Tarjeta de Inicio de Sesión */}
      <main className={styles.authBody}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Welcome back!</h1>

          {errorMessage && (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
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
                  autoComplete="username"
                  className={styles.inputField}
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className={styles.inputField}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                  Verifying...
                </>
              ) : (
                'Login'
              )}
            </button>

            <div className={styles.forgotLinkWrapper}>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
          </form>
        </div>

        <p className={styles.authFooterText}>
          Don’t have an account?
          <Link to="/register" className={styles.authFooterLink}>
            Signup now!
          </Link>
        </p>
      </main>
    </div>
  );
};
