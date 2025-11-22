# Troubleshooting Guide

## Registration Failed - 404 Error

If you're getting a 404 error when trying to register, follow these steps:

### 1. Check Backend Server is Running

Make sure your backend server is running:

```bash
cd backend
npm run dev
# or
node server.js
```

The backend should be running on `http://localhost:3000` (or the port specified in `backend/.env`).

### 2. Verify Backend Routes

Test the backend API directly:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### 3. Check Frontend Environment Variables

Create `frontend_app/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important:** 
- If your backend runs on a different port, update the URL
- If your frontend runs on a different port (e.g., 3001), make sure backend CORS allows it

### 4. Check CORS Configuration

Update `backend/.env`:

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

Or for development, you can allow all origins (NOT recommended for production):

```env
CORS_ORIGIN=*
```

Then restart your backend server.

### 5. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for CORS errors or network errors
- **Network tab**: 
  - Check the actual request URL
  - Check the response status and headers
  - Look for CORS headers in the response

### 6. Verify Port Conflicts

- **Backend**: Usually runs on port 3000
- **Frontend**: Next.js will use port 3000 if available, otherwise 3001

If both try to use port 3000:
- Change backend port in `backend/.env`: `PORT=3000`
- Frontend will automatically use 3001
- Update CORS to allow both ports

### 7. Test Backend Connection

Visit `http://localhost:3001/api/test` (or your frontend URL) to test backend connectivity.

### 8. Common Issues

#### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"
**Solution**: Backend server is not running. Start it with `npm run dev` in the backend directory.

#### Issue: CORS Error
**Solution**: 
1. Update `backend/.env` CORS_ORIGIN to include your frontend URL
2. Restart backend server
3. Clear browser cache

#### Issue: 404 Not Found
**Solution**: 
1. Verify backend routes are registered in `backend/server.js`
2. Check the API URL in frontend `.env.local`
3. Ensure backend server is running

#### Issue: 500 Internal Server Error
**Solution**: 
1. Check backend console for error messages
2. Verify database connection
3. Check backend logs

### 9. Debug Steps

1. **Check backend logs**: Look at the terminal where backend is running
2. **Check frontend logs**: Look at browser console and Next.js terminal
3. **Test API directly**: Use curl or Postman to test backend endpoints
4. **Verify database**: Make sure MySQL is running and database exists

### 10. Quick Fix Checklist

- [ ] Backend server is running (`cd backend && npm run dev`)
- [ ] Database is running and accessible
- [ ] `frontend_app/.env.local` exists with correct API URL
- [ ] Backend `.env` has correct CORS_ORIGIN
- [ ] Both servers restarted after config changes
- [ ] Browser cache cleared
- [ ] No port conflicts

### Still Having Issues?

1. Check the Network tab in browser DevTools to see the exact request/response
2. Check backend terminal for error messages
3. Verify all environment variables are set correctly
4. Make sure you're using the correct URLs (no typos)

