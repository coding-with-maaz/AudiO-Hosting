# AUDioHub - Frontend

This is the Next.js frontend application for AUDioHub.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:3000`

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important:** Make sure your backend server is running on port 3000, or update the URL accordingly.

3. **Start the development server**

```bash
npm run dev
```

The frontend will run on `http://localhost:3001` (or the next available port).

### Verify Backend Connection

Visit `http://localhost:3001/api/test` to check if the backend is accessible.

## 🔧 Configuration

### Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:3000`)

### Backend CORS Configuration

Make sure your backend `.env` file includes the frontend URL in CORS_ORIGIN:

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

## 📁 Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── hooks/           # React Query hooks
├── lib/             # API client and utilities
├── store/           # Zustand state management
├── types/           # TypeScript types
└── utils/           # Helper functions
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### 404 Errors on API Calls

1. **Check backend is running**: Make sure the backend server is running on port 3000
2. **Check CORS**: Verify backend CORS allows your frontend origin
3. **Check API URL**: Verify `NEXT_PUBLIC_API_URL` in `.env.local` matches your backend URL
4. **Check network**: Open browser DevTools Network tab to see the actual request URL

### Common Issues

- **Port conflict**: If port 3000 is taken, Next.js will use 3001. Update backend CORS accordingly.
- **CORS errors**: Add your frontend URL to backend `CORS_ORIGIN` environment variable.
- **404 on /api/auth/register**: Ensure backend server is running and routes are properly configured.

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
