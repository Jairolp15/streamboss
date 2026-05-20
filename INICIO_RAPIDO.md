# 🚀 INICIO RÁPIDO — StreamMaster_ve

## ⚠️ Requisitos (instalar si no están)
| Herramienta | Descarga |
|---|---|
| Python 3.11+ | https://python.org/downloads |
| Node.js 18+ | https://nodejs.org |

---

## 1️⃣ BACKEND (FastAPI)

```powershell
cd streamboss-backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
```

> Solo la primera vez. Si ya tienes la carpeta `venv`, salta al siguiente paso.

**▶️ Iniciar el backend:**
```powershell
venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> Si es la primera vez y **no trajiste** el archivo `streamboss.db`, pobla la base de datos primero:
> ```powershell
> venv\Scripts\python seed.py
> ```

---

## 2️⃣ FRONTEND (React)

```powershell
cd streamboss-frontend
npm install
```

> Solo la primera vez. Si ya tienes `node_modules`, salta al siguiente paso.

**▶️ Iniciar el frontend:**
```powershell
npm run dev
```

---

## 🌐 URLs

| Servicio | URL |
|---|---|
| App principal | http://localhost:5173 |
| API Backend | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| Reportar error (público) | http://localhost:5173/reporte-error |

---

## 🔑 Credenciales iniciales

| Campo | Valor |
|---|---|
| Email | `admin@streamboss.com` |
| Contraseña | `Admin1234!` |
