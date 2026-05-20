# StreamBoss — Guía de Instalación y Arranque

## Requisitos de Sistema

| Herramienta | Versión | Descargar |
|---|---|---|
| Python | 3.11+ | https://python.org/downloads |
| Node.js | 18+ LTS | https://nodejs.org |

---

## BACKEND (FastAPI)

### 1. Abrir terminal en la carpeta del proyecto

```powershell
cd "c:\Users\ITran\Downloads\PROGRAMA BELMON\streamboss-backend"
```

### 2. Crear entorno virtual e instalar dependencias

```powershell
python -m venv venv
venv\Scripts\pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```powershell
copy .env.example .env
```
*(Opcionalmente editar `.env` para cambiar la `SECRET_KEY`)*

### 4. Poblar base de datos con datos iniciales

```powershell
venv\Scripts\python seed.py
```

Esto crea:
- 6 plataformas (Netflix, Disney+, Prime Video, HBO Max, Paramount+, Crunchyroll)
- Usuario admin: `admin@streamboss.com` / contraseña: `Admin1234!`

### 5. Iniciar servidor de desarrollo

```powershell
venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**API disponible en:** http://localhost:8000  
**Documentación Swagger:** http://localhost:8000/docs

---

## FRONTEND (React PWA)

> **Requisito:** Instalar Node.js 18+ desde https://nodejs.org antes de continuar

### 1. Abrir nueva terminal en la carpeta del frontend

```powershell
cd "c:\Users\ITran\Downloads\PROGRAMA BELMON\streamboss-frontend"
```

### 2. Instalar dependencias

```powershell
npm install
```

### 3. Configurar variables de entorno

```powershell
copy .env.example .env.local
```

*(El proxy en vite.config.js ya redirige `/api` → `http://localhost:8000`)*

### 4. Iniciar servidor de desarrollo

```powershell
npm run dev
```

**App disponible en:** http://localhost:5173

---

## Credenciales Iniciales

| Campo | Valor |
|---|---|
| Email | `admin@streamboss.com` |
| Contraseña | `Admin1234!` |
| Rol | Administrador |

---

## Producción con PM2

```powershell
# Instalar PM2 globalmente (solo una vez)
npm install -g pm2

# Backend
cd streamboss-backend
pm2 start ecosystem.config.js

# Frontend
cd streamboss-frontend
npm run build
pm2 serve dist 3000 --spa --name streamboss-frontend

# Guardar configuración y auto-arranque
pm2 save
pm2 startup
```

---

## Estructura del Proyecto

```
PROGRAMA BELMON/
├── streamboss-backend/      # FastAPI + SQLite
│   ├── app/
│   │   ├── main.py          # Entry point
│   │   ├── models/          # SQLAlchemy ORM (8 tablas)
│   │   ├── schemas/         # Pydantic validators
│   │   ├── routers/         # Endpoints REST
│   │   ├── services/        # Lógica de negocio
│   │   ├── tasks/           # Cron (vencimientos 3 días)
│   │   └── core/            # JWT, seguridad, RBAC
│   ├── seed.py              # Datos iniciales
│   └── requirements.txt
│
└── streamboss-frontend/     # React + Vite + PWA
    ├── src/
    │   ├── pages/admin/     # Dashboard, Cuentas, Suscripciones...
    │   ├── pages/distributor/ # Mis Clientes, Solicitar Cuenta
    │   ├── components/      # UI reutilizable
    │   └── api/             # Clientes Axios
    └── package.json
```

---

## Endpoints Principales

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Iniciar sesión |
| GET | `/api/v1/subscriptions` | Ver suscripciones |
| GET | `/api/v1/subscriptions/expiring` | Por vencer (≤3 días) |
| GET | `/api/v1/subscriptions/{id}/whatsapp` | Link wa.me |
| GET | `/api/v1/master-accounts` | Cuentas maestras |
| GET | `/api/v1/master-accounts/{id}` | Detalle + perfiles |
| POST | `/api/v1/account-requests` | Solicitar perfil |
| PATCH | `/api/v1/account-requests/{id}` | Aprobar/rechazar |
