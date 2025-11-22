# Port Configuration Guide

## Current Port Setup

- **Backend Server:** Port `3000`
- **Frontend Server:** Port `3001`

## Why Different Ports?

Both servers need to run simultaneously, so they must use different ports:
- Backend API: `http://localhost:3000`
- Frontend App: `http://localhost:3001`

## Configuration Files

### Backend Port (Port 3000)

**File:** `backend/.env`
```env
PORT=3000
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### Frontend Port (Port 3001)

**File:** `frontend_app/package.json`
```json
"scripts": {
  "dev": "next dev -p 3001",
  "start": "next start -p 3001"
}
```

**File:** `frontend_app/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Starting the Servers

### 1. Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:3000`

### 2. Start Frontend (Terminal 2)
```bash
cd frontend_app
npm run dev
```
Frontend will run on: `http://localhost:3001`

## Changing Ports

### Change Backend Port

1. Update `backend/.env`:
```env
PORT=4000  # New port
```

2. Update `frontend_app/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

3. Update `backend/.env` CORS:
```env
CORS_ORIGIN=http://localhost:3001,http://localhost:4000
```

### Change Frontend Port

1. Update `frontend_app/package.json`:
```json
"dev": "next dev -p 4001",
"start": "next start -p 4001"
```

2. Update `backend/.env` CORS:
```env
CORS_ORIGIN=http://localhost:4001,http://localhost:3000
```

## Troubleshooting Port Conflicts

### Port Already in Use

**Windows:**
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Verify Ports Are Available

**Check if ports are in use:**
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Mac/Linux
lsof -ti:3000
lsof -ti:3001
```

## Quick Reference

| Service | Port | URL | Config File |
|---------|------|-----|-------------|
| Backend API | 3000 | http://localhost:3000 | `backend/.env` |
| Frontend App | 3001 | http://localhost:3001 | `frontend_app/package.json` |

## Important Notes

1. **Always start backend first** - Frontend needs backend to be running
2. **Check CORS configuration** - Backend must allow frontend origin
3. **Environment variables** - Frontend needs correct API URL
4. **Port conflicts** - Kill existing processes before starting servers

