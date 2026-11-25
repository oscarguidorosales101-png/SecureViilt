// ==============================================================================
// SECUREVAULT - PÁGINA DE REGISTRO CON VERIFICACIÓN DE POLÍTICA DE SEGURIDAD
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthStyles.module.css';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Validación de complejidad de contraseña (política de seguridad: min 10 caracteres)
  const hasMinLength = password.length >= 10;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const isPasswordPolicyMet = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isPasswordPolicyMet) {
      setErrorMessage('La contraseña debe cumplir con todos los requisitos de complejidad (mínimo 10 caracteres).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const displayName = name.trim() || email.split('@')[0];
      await register(displayName, email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error.message || 'Error en el registro');
      } else {
        setErrorMessage('No se pudo completar el registro en el servidor.');
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
        <Link to="/login" className={styles.headerActionBtn}>
          Sign In
        </Link>
      </header>

      <main className={styles.authBody}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSubtitle}>Comienza a proteger tus notas y datos con cifrado AES-256-GCM.</p>

          {errorMessage && (
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="name">Nombre Completo</label>
              <div className={styles.inputWrapper}>
                <input
                  id="name"
                  type="text"
                  required
                  className={styles.inputField}
                  placeholder="Ej. Oscar Guido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  className={styles.inputField}
                  placeholder="••••••••••••"
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

              {/* Indicadores de requisitos de contraseña */}
              <ul className={styles.passwordHintList}>
                <li className={`${styles.passwordHintItem} ${hasMinLength ? styles.validHint : ''}`}>
                  <CheckCircle2 size={12} /> Mínimo 10 caracteres
                </li>
                <li className={`${styles.passwordHintItem} ${hasUppercase && hasLowercase ? styles.validHint : ''}`}>
                  <CheckCircle2 size={12} /> Mayúsculas y minúsculas
                </li>
                <li className={`${styles.passwordHintItem} ${hasNumber && hasSymbol ? styles.validHint : ''}`}>
                  <CheckCircle2 size={12} /> Al menos un número y un símbolo especial (!@#$...)
                </li>
              </ul>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
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
              disabled={isSubmitting || !isPasswordPolicyMet}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Signup for Free'
              )}
            </button>
          </form>
        </div>

        <p className={styles.authFooterText}>
          Already have an account?
          <Link to="/login" className={styles.authFooterLink}>
            Login now!
          </Link>
        </p>
      </main>
    </div>
  );
};
