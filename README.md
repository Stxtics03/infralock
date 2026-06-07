# INFRAlock

Data Centre Infrastructure Management System — base project scaffold.

## Prerequisites

- Docker Desktop
- Node.js 20+
- Supabase project (for auth)

## Setup

1. Copy `.env` and fill in Supabase credentials.
2. Start infrastructure:

```bash
docker compose up -d
```

3. Install and run backend:

```bash
cd backend && npm install && npm start
```

4. Install and run frontend:

```bash
cd frontend && npm install && npm run dev
```

5. Create MinIO bucket `infralock-vault` at http://localhost:9001 (login: minioadmin / minioadmin).

## Verify database

```bash
docker exec infralock_mysql mysql -u infralock_user -pinfralock_pass infralock -e "SHOW TABLES;"
docker exec infralock_mysql mysql -u infralock_user -pinfralock_pass infralock -e "SHOW TRIGGERS;"
docker exec infralock_mysql mysql -u infralock_user -pinfralock_pass infralock -e "SHOW PROCEDURE STATUS WHERE Db = 'infralock';"
```

## Next features

- `02_ANOMALY_BUILD.md` — AI anomaly detection
- `03_MFA_BUILD.md` — Multi-factor authentication
