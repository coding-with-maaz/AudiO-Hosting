# AUDioHub

A comprehensive audio hosting platform similar to Doodstream, built with Node.js backend and Next.js frontend.

## 🚀 Features

### Backend (Node.js + Express + Sequelize)
- ✅ Audio upload, storage, and management
- ✅ Direct download links (`/d/:id`) and embed links (`/e/:id`)
- ✅ Folder management with nested folders
- ✅ Folder sharing with password protection
- ✅ Bulk operations (upload, delete, move, update)
- ✅ Advanced search and filtering
- ✅ Audio encoding (MP3, AAC, OGG, WAV)
- ✅ Bandwidth tracking and limits
- ✅ User authentication (JWT)
- ✅ Pricing plans and subscriptions
- ✅ Affiliate marketing system
- ✅ Analytics and reporting
- ✅ Playlists
- ✅ User interactions (Favorites, Comments, Ratings)
- ✅ API keys management
- ✅ Webhook support
- ✅ Payment gateway integration (Stripe, PayPal)
- ✅ Email system (verification, password reset)
- ✅ Admin dashboard
- ✅ Trash/recycle bin
- ✅ Remote upload from URL
- ✅ Duplicate file detection
- ✅ File expiration dates
- ✅ Queue system for background jobs

### Frontend (Next.js + TypeScript + Tailwind CSS)
- 🚧 Coming soon - Full-featured web application

## 📁 Project Structure

```
├── backend/              # Node.js backend API
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── migrations/      # Database migrations
│   ├── seeders/         # Database seeders
│   ├── utils/           # Utility functions
│   ├── workers/         # Background job workers
│   └── server.js        # Main server file
│
└── frontend_app/         # Next.js frontend
    ├── src/
    │   └── app/         # Next.js app directory
    └── public/          # Static assets
```

## 🛠️ Setup

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=audio_hosting_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
```

4. **Create database**
```bash
mysql -u root -p
CREATE DATABASE audio_hosting_db;
```

5. **Run migrations**
```bash
npm run db:migrate
npm run db:seed
```

6. **Create admin user**
```bash
npm run create-admin
```

7. **Start server**
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend_app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Start development server**
```bash
npm run dev
```

Frontend will run on `http://localhost:3001`

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile

### Audio Management
- `POST /api/audio/upload` - Upload audio
- `GET /api/audio` - List audios
- `GET /api/audio/:id` - Get audio details
- `PUT /api/audio/:id` - Update audio
- `DELETE /api/audio/:id` - Delete audio

### Sharing
- `GET /d/:id` - Direct download link
- `GET /e/:id` - Embed player
- `GET /f/:id` - Shared folder

### Bulk Operations
- `POST /api/bulk/upload` - Bulk upload
- `POST /api/bulk/delete` - Bulk delete
- `POST /api/bulk/move` - Bulk move

### Search
- `GET /api/search/audios` - Advanced search
- `GET /api/search/filters` - Get filters

### Playlists
- `POST /api/playlists` - Create playlist
- `GET /api/playlists` - Get playlists
- `POST /api/playlists/:id/audios` - Add to playlist

### And many more...

See `backend/README.md` for complete API documentation.

## 🔧 Technologies

### Backend
- Node.js
- Express.js
- Sequelize ORM
- MySQL
- JWT Authentication
- Bull (Queue System)
- Redis
- Multer (File Upload)
- Nodemailer (Email)

### Frontend
- Next.js 16
- TypeScript
- Tailwind CSS
- React Query
- Zustand (State Management)
- React Hook Form
- Zod (Validation)

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue in the repository.

