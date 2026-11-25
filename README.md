# SecureVault 🛡️
Sistema web de alta seguridad para almacenamiento y gestión de notas privadas y datos personales sensibles.

---

## 1. Visión General
SecureVault es una aplicación web empresarial diseñada bajo estrictos lineamientos de ciberseguridad, cumpliendo con las directrices del **OWASP Top 10:2025** y el modelo de amenazas **STRIDE**. Su propósito central es garantizar la confidencialidad, integridad y disponibilidad de la información privada de los usuarios.

---

## 2. Pila Tecnológica
- **Frontend:** React, Vite, JavaScript (JSX), CSS modular puro, React Router, Axios (gestión de credenciales y cookies de sesión).
- **Backend:** Node.js (v24.x LTS-ready), Express, Zod (validación estricta de esquemas), Helmet, express-rate-limit.
- **Base de Datos & ORM:** PostgreSQL en Supabase / Local con Prisma ORM 7 (`@prisma/adapter-pg`).
- **Seguridad Criptográfica:**
  - Contraseñas: **Argon2id** (memoria: 19 MiB, iteraciones: 2, paralelismo: 1).
  - Datos sensibles y notas: **AES-256-GCM** (IV aleatorio de 12 bytes por operación + Auth Tag de 16 bytes).
  - Tokens de recuperación: Generación con **CSPRNG** (256 bits) y almacenamiento mediante hash **SHA-256**.
- **Gestión de Sesiones:** `express-session` respaldado por `connect-pg-simple` en PostgreSQL con cookies `HttpOnly`, `Secure` y `SameSite`.
- **Notificaciones por Correo:** `nodemailer` con transporte autenticado TLS/STARTTLS vía Gmail SMTP.
- **Observabilidad:** `pino` logger con redacción estructurada automática de PII (Información Personalmente Identificable).

---

## 3. Estructura de Directorios

```text
-SecureVilt/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/ (common, layout, feedback)
│       ├── config/
│       ├── context/
│       ├── pages/ (auth, dashboard, notes, profile, admin)
│       ├── routes/
│       ├── services/
│       ├── styles/
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── security/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── app.js
│   ├── tests/ (unit, integration)
│   ├── prisma.config.ts
│   ├── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── README.md
└── .gitignore
```

---

## 4. Guía Rápida de Configuración Local

### Requisitos Previos
- Node.js versión `>= 20.x` (verificado con `node -v`).
- Instancia activa de PostgreSQL o proyecto en Supabase.

### Pasos Iniciales
1. Configuración de variables en el backend:
   ```bash
   cd backend
   cp .env.example .env
   # Editar .env con las credenciales correspondientes
   ```
2. Instalación de dependencias (se ejecutará tras la aprobación de la fase correspondiente):
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

---

## 5. Cumplimiento de Ciberseguridad (OWASP Top 10:2025)
- **A01 Broken Access Control:** Validación de propiedad en capa de base de datos (`WHERE id = :id AND user_id = :sessionUserId`).
- **A02 Security Misconfiguration:** Helmet con cabeceras estrictas, cookies seguras y CORS acotado.
- **A03 Software Supply Chain Failures:** Bloqueo de dependencias mediante `package-lock.json` y auditoría con `npm audit`.
- **A04 Cryptographic Failures:** Argon2id para contraseñas, AES-256-GCM para datos en reposo y rotación de llaves versionada.
- **A05 Injection:** Prisma ORM con sentencias parametrizadas y validación previa con Zod.
- **A06 Insecure Design:** Modelo de amenazas STRIDE, flujo de recuperación anti-enumeración.
- **A07 Authentication Failures:** Rate limiting granular, regeneración de sesión post-login (`req.session.regenerate`).
- **A08 Integrity Failures:** Verificación de integridad criptográfica con Authentication Tag GCM.
- **A09 Logging Failures:** Logger estructurado Pino con enmascaramiento de credenciales y bitácora forense `security_logs`.
- **A10 Exception Handling:** Manejador centralizado de errores con códigos de estado genéricos sin revelar stack traces.
