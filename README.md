# ForgeIQ — Metallurgy Simulation Platform

> **Copyright © 2026 Y. Alibek · NSMLab (Net Shape Manufacturing Laboratory). All rights reserved.**
> See [LICENSE](./LICENSE) for terms of use. Unauthorized reproduction, modification, or distribution is prohibited.

Web application for metallurgical process analysis: **cogging**, **processing maps**, and **3D preform STL generation** from neural-network models.

**Author:** Y. Alibek
**Organization:** NSMLab — Net Shape Manufacturing Laboratory

> 📘 **For a complete, detailed reference of every program, the exact formulas used, and an honest list of what the platform CANNOT do, see [CAPABILITIES.md](./CAPABILITIES.md).**

## Architecture

| Service | Tech | Port | Purpose |
|---|---|---|---|
| `frontend` | Next.js 15 + React 19 | **3000** | UI, auth (MongoDB + iron-session) |
| `backend1` | Flask + TensorFlow/Keras | **5000** | Cogging models, processing-map graphs |
| `backend2` | Flask + numpy-stl/pymeshlab | **5001** | Voxel → STL 3D preform pipeline |

```
┌────────────┐      ┌──────────┐      ┌──────────────────┐
│  Browser   │ ───▶ │ Frontend │ ───▶ │ MongoDB (cloud)  │
│ :3000      │      │ Next.js  │      └──────────────────┘
└────────────┘      └────┬─────┘
                         │
                         ├──▶ backend1 :5000  (Flask, ML models)
                         └──▶ backend2 :5001  (Flask, 3D STL)
```

## Quick start (Windows — recommended for end users)

1. **First time** — double-click `run_first_time.exe`
   - Installs Python venvs, Node deps, builds frontend, launches everything
   - Takes 10–20 minutes depending on internet speed
2. **After that** — double-click `run.exe`
   - Skips installation, just starts the 3 services
3. Open <http://localhost:3000>

The launcher checks Python and Node.js are installed and tells you what to install if not.

## Quick start (Docker — recommended for servers)

```bash
# 1. Copy and edit env file
cp .env.example .env
# Edit .env — set DB_URI and SESSION_PASSWORD

# 2. Build and start everything
docker compose -f .config/docker-compose.yml --env-file .env up -d --build

# 3. Open http://localhost:3000
```

To stop: `docker compose -f .config/docker-compose.yml down`

## Manual / dev start

```bash
# Backend 1
cd backend1
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
waitress-serve --listen=0.0.0.0:5000 main:app

# Backend 2 (separate terminal)
cd backend2
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
waitress-serve --listen=0.0.0.0:5001 main:app

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local        # edit DB_URI and SESSION_PASSWORD
pnpm install
pnpm dev                          # or `pnpm build && pnpm start`
```

## Configuration

All sensitive values are environment variables. Templates:

- **`/.env.example`** — for Docker (`docker-compose`)
- **`/frontend/.env.example`** — for local Next.js dev/start

Required variables:

| Variable | Description |
|---|---|
| `DB_URI` | MongoDB connection string |
| `DB_NAME` | DB name (default `forgeiq`) |
| `SESSION_PASSWORD` | **Minimum 32 chars.** Encrypts session cookies. |
| `NEXT_PUBLIC_BACKEND_URL` | Public URL of backend1 (default `http://localhost:5000`) |
| `NEXT_PUBLIC_BACKEND2_URL` | Public URL of backend2 (default `http://localhost:5001`) |

Generate a strong `SESSION_PASSWORD` (PowerShell):
```powershell
-join ((33..126) | Get-Random -Count 48 | % {[char]$_})
```

## API Endpoints

### Backend1 (`:5000`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/cogging/fourimages1h5` | Train cogging model → returns `.h5` + plot |
| POST | `/api/cogging/traindatacorrection` | Correct train data Excel |
| POST | `/api/cogging/passschedule` | Optimize pass schedule from `.h5` model |
| POST | `/api/processingmap/main_graph` | 2D / 3D processing-map graphs |
| POST | `/api/processingmap/plot_values_against_strain` | Strain vs values plot |
| POST | `/api/processingmap/collect_values_for_strain` | Export strain table → Excel |

### Backend2 (`:5001`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/threedpreform/get_3d_model` | Voxel pipeline → STL (base64) |

All errors return:
```json
{ "status": "error", "error": "..." }
```

## Project structure

```
ready_to_send_final/
├── .config/
│   ├── docker-compose.yml
│   ├── run.cpp                 # Source for run.exe (quick launcher)
│   └── run_first_time.cpp      # Source for run_first_time.exe (installer)
├── backend1/                   # Cogging + Processing Map (Flask)
│   ├── cogginglogic/
│   ├── processingmaplogic/
│   ├── main.py
│   └── Dockerfile
├── backend2/                   # 3D Preform (Flask)
│   ├── threedlogic/
│   ├── main.py
│   └── Dockerfile
├── frontend/                   # Next.js 15
│   ├── src/app/
│   ├── src/components/
│   ├── src/lib/
│   ├── .env.example
│   └── Dockerfile
├── .env.example                # For Docker
├── .gitignore
├── README.md
├── run.exe
└── run_first_time.exe
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Missing environment variable DB_URI" | Create `frontend/.env.local` from `.env.example` |
| "Missing or weak SESSION_PASSWORD" | Set a 32+ char value in `.env.local` |
| Frontend can't reach backends | Check `NEXT_PUBLIC_BACKEND_URL` matches running port |
| MongoDB connection timeout | Confirm `DB_URI` is reachable; whitelist your IP on Atlas |
| `pip install` fails on Windows | Install Visual C++ Build Tools, retry |
| Port already in use | Change `FRONTEND_PORT` / `BACKEND1_PORT` / `BACKEND2_PORT` in `.env` |
| `run_first_time.exe` says Python not found | Install Python 3.9+ and tick "Add Python to PATH" during install |

## Security notes

- Passwords are stored hashed with **bcrypt** (legacy plaintext users auto-upgrade on first login).
- Session cookies are encrypted with `SESSION_PASSWORD`; **always rotate this for production**.
- `secure: true` cookies are enabled automatically when `NODE_ENV=production`.
- Flask `debug` is OFF in production (`FLASK_ENV=production`).

## License

Internal project. Not for redistribution.
