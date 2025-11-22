# Quick Start Guide

## 🚀 Starting the Application

### Step 1: Start Backend Server

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies** (if not already done)
```bash
npm install
```

3. **Check if port 3000 is available**
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -ti:3000
```

4. **Kill process on port 3000 if needed**
```bash
# Windows - Find PID first, then kill
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use the script
npm run kill-port 3000

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

5. **Start backend server**
```bash
npm run dev
```

The backend should start on `http://localhost:3000`

### Step 2: Start Frontend Server

1. **Open a new terminal and navigate to frontend**
```bash
cd frontend_app
```

2. **Install dependencies** (if not already done)
```bash
npm install
```

3. **Verify .env.local exists**
```bash
# Should contain:
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Start frontend server**
```bash
npm run dev
```

The frontend will start on `http://localhost:3001` (or next available port)

### Step 3: Verify Connection

1. **Test backend health**
   - Visit: `http://localhost:3000/health`
   - Should return: `{"success":true,"message":"Server is running"}`

2. **Test frontend-backend connection**
   - Visit: `http://localhost:3001/api/test`
   - Should show backend connection status

3. **Try registration**
   - Visit: `http://localhost:3001/register`
   - Fill in the form and submit

## 🔧 Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use the kill-port script
cd backend
npm run kill-port 3000
```

### 404 Error on Registration

**Possible causes:**
1. Backend server not running
2. Wrong API URL in frontend
3. CORS configuration issue

**Solution:**
1. Verify backend is running: `http://localhost:3000/health`
2. Check `frontend_app/.env.local` has correct URL
3. Verify `backend/.env` CORS_ORIGIN includes frontend URL
4. Restart both servers after config changes

### CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Update `backend/.env`:
```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

2. Restart backend server

### Database Connection Error

**Error:** `Unable to connect to the database`

**Solution:**
1. Verify MySQL is running
2. Check database credentials in `backend/.env`
3. Create database if it doesn't exist:
```sql
CREATE DATABASE audio_hosting_db;
```

4. Run migrations:
```bash
cd backend
npm run db:migrate
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=audio_hosting_db
DB_USER=root
DB_PASSWORD=your_password
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## ✅ Checklist

Before starting:
- [ ] MySQL database is running
- [ ] Database `audio_hosting_db` exists
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Port 3000 is available
- [ ] `.env` files are configured correctly

After starting:
- [ ] Backend server running on port 3000
- [ ] Frontend server running (usually port 3001)
- [ ] Backend health check works
- [ ] Frontend can connect to backend
- [ ] Registration form works

