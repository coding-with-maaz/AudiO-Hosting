# How to Start the Servers

## 🚀 Quick Start

### 1. Kill Process on Port 3000 (if needed)

**Windows:**
```bash
# Find the process
netstat -ano | findstr :3000

# Kill it (replace <PID> with the actual process ID)
taskkill /PID <PID> /F

# Or use the script
cd backend
npm run kill-port 3000
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
Database connection established successfully.
Database connection ready.
Server is running on port 3000
Environment: development
```

### 3. Start Frontend Server (in a new terminal)

```bash
cd frontend_app
npm run dev
```

**Expected output:**
```
  ▲ Next.js 16.0.3
  - Local:        http://localhost:3001
  - Environments: .env.local
```

### 4. Verify Everything Works

1. **Backend Health Check:**
   - Visit: http://localhost:3000/health
   - Should see: `{"success":true,"message":"Server is running"}`

2. **Frontend-Backend Connection:**
   - Visit: http://localhost:3001/api/test
   - Should show backend connection status

3. **Try Registration:**
   - Visit: http://localhost:3001/register
   - Fill form and submit

## ⚠️ Common Issues

### Port 3000 Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### 404 Error on API Calls

**Causes:**
1. Backend server not running
2. Wrong API URL in frontend
3. Backend crashed

**Solution:**
1. Check backend terminal for errors
2. Verify backend is running: http://localhost:3000/health
3. Check `frontend_app/.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:3000`
4. Restart backend server

### CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Update `backend/.env`:
```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

2. Restart backend server

## 📝 Port Configuration

- **Backend:** Port 3000 (configured in `backend/.env`)
- **Frontend:** Port 3001 (or next available, configured automatically by Next.js)

If you need to change ports:
1. **Backend:** Update `PORT` in `backend/.env`
2. **Frontend:** Update `NEXT_PUBLIC_API_URL` in `frontend_app/.env.local`
3. **CORS:** Update `CORS_ORIGIN` in `backend/.env` to include new frontend port

