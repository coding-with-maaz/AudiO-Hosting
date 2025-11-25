# AUDioHub Backend

A comprehensive Node.js backend for an audio hosting platform with affiliate marketing, pricing plans, and analytics features - similar to Doodstream.

## Features

### Core Features
- 🎵 **Audio Upload & Management** - Upload, store, and manage audio files
- 🔗 **Direct Links & Embedding** - Generate direct download links (`/d/:id`) and embed links (`/e/:id`) with embed codes
- 📁 **Folder Management** - Create folders, organize audio files, nested folders support
- 📤 **Folder Sharing** - Share folders with unique links (`/f/:id`), password protection, embed support
- 📦 **Folder Export** - Export entire folders as ZIP files
- ✏️ **Renaming** - Rename audio files and folders
- 🎚️ **Audio Encoding** - Transcode audio to different formats (MP3, AAC, OGG, WAV) with customizable bitrates
- 📋 **Metadata Extraction** - Extract audio metadata using ffmpeg/ffprobe

### New Features (Latest Update)
- 📊 **Bandwidth Tracking** - Track and limit monthly bandwidth usage per user
- 📤 **Bulk Operations** - Upload, delete, move, and update multiple files at once
- 🔍 **Advanced Search** - Powerful search with filters, sorting, and pagination
- 📧 **Email System** - Email verification, password reset, and notifications
- 👨‍💼 **Admin Dashboard** - Comprehensive admin panel with user and content management
- 🔑 **API Keys** - Programmatic access with API key authentication
- 🗑️ **Trash/Recycle Bin** - Soft delete with restore functionality
- 📋 **Playlists** - Create and manage playlists with public sharing
- ❤️ **Favorites** - Save favorite audio files
- 💬 **Comments** - Comment system with nested replies
- ⭐ **Ratings** - 1-5 star rating system with averages

### Platform Features
- 👥 **User Authentication** - JWT-based authentication system
- 💳 **Pricing Plans** - Multiple subscription tiers with different storage and bandwidth limits
- 🤝 **Affiliate Marketing** - Complete affiliate system with commission tracking
- 📊 **Analytics** - Track views, downloads, plays, and user engagement
- 💰 **Payment Processing** - Transaction management for subscriptions and payouts
- 🔒 **Security** - Helmet, CORS, rate limiting, and input validation
- 📈 **Scalable** - Built with Sequelize ORM for easy database management

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for database management
- **MySQL** - Database (configurable)
- **JWT** - Authentication
- **Multer** - File upload handling
- **Bcrypt** - Password hashing

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd AUDioHub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=audio_hosting_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

UPLOAD_DIR=./uploads/audio
MAX_FILE_SIZE=104857600
ALLOWED_AUDIO_TYPES=audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac

AFFILIATE_COMMISSION_RATE=0.15
AFFILIATE_MIN_PAYOUT=50
```

4. **Create database**
```bash
mysql -u root -p
CREATE DATABASE audio_hosting_db;
```

5. **Run migrations and seeders**
```bash
npm run db:migrate
npm run db:seed
```

6. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

### Audio Management
- `GET /api/audio` - Get all audios (public)
- `GET /api/audio/:id` - Get audio details
- `GET /api/audio/:id/download` - Download audio file
- `POST /api/audio/upload` - Upload audio (protected)
- `GET /api/audio/my/list` - Get user's audios (protected)
- `PUT /api/audio/:id` - Update audio (protected)
- `PUT /api/audio/:id/rename` - Rename audio (protected)
- `DELETE /api/audio/:id` - Delete audio (protected)

### Sharing & Links
- `GET /d/:id` - Direct download link (public, uses shareToken or id)
- `GET /e/:id` - Embed player page (public, uses shareToken or id)
- `GET /api/share/links/:id` - Get share links (direct, embed, embed code) (protected)

### Folder Management
- `POST /api/folders` - Create folder (protected)
- `GET /api/folders` - Get user's folders (protected)
- `GET /api/folders/:id` - Get folder details (protected)
- `PUT /api/folders/:id` - Update folder (protected)
- `PUT /api/folders/:id/rename` - Rename folder (protected)
- `DELETE /api/folders/:id` - Delete folder (protected)
- `POST /api/folders/:id/enable-sharing` - Enable folder sharing (protected)
- `POST /api/folders/:id/disable-sharing` - Disable folder sharing (protected)
- `GET /api/folders/:id/export` - Export folder as ZIP (protected)
- `GET /f/:id` - Access shared folder (public)

### Audio Encoding
- `GET /api/encoding/formats` - Get available encoding formats (protected)
- `POST /api/encoding/encode/:id` - Encode audio to different format (protected)
- `POST /api/encoding/extract-metadata/:id` - Extract audio metadata (protected)

### Pricing Plans
- `GET /api/plans` - Get all active plans
- `GET /api/plans/:id` - Get plan details
- `POST /api/plans` - Create plan (admin only)
- `PUT /api/plans/:id` - Update plan (admin only)
- `DELETE /api/plans/:id` - Delete plan (admin only)

### Subscriptions
- `POST /api/subscriptions/subscribe` - Subscribe to a plan (protected)
- `GET /api/subscriptions/my` - Get user subscriptions (protected)
- `PUT /api/subscriptions/:id/cancel` - Cancel subscription (protected)
- `POST /api/subscriptions/complete-payment` - Complete payment (protected)

### Affiliate Marketing
- `GET /api/affiliate/track/:code` - Track affiliate click (public)
- `POST /api/affiliate/create` - Create affiliate account (protected)
- `GET /api/affiliate/my` - Get affiliate info (protected)
- `GET /api/affiliate/my/stats` - Get affiliate statistics (protected)
- `POST /api/affiliate/payout` - Request payout (protected)
- `POST /api/affiliate/process-commission` - Process commission (admin only)

### Analytics
- `GET /api/analytics/audio/:audioId` - Get audio analytics (protected)
- `GET /api/analytics/my` - Get user analytics (protected)

### Bulk Operations
- `POST /api/bulk/upload` - Upload multiple files (protected, max 50)
- `POST /api/bulk/delete` - Delete multiple audio files (protected)
- `POST /api/bulk/move` - Move multiple files to folder (protected)
- `POST /api/bulk/update` - Bulk update audio properties (protected)

### Advanced Search
- `GET /api/search/audios` - Advanced search with filters (public)
- `GET /api/search/filters` - Get available filter options (public)

### Email & Verification
- `GET /api/email/verify-email` - Verify email with token (public)
- `POST /api/email/request-password-reset` - Request password reset (public)
- `POST /api/email/reset-password` - Reset password (public)
- `POST /api/email/resend-verification` - Resend verification email (protected)

### Admin Dashboard
- `GET /api/admin/dashboard` - Dashboard statistics (admin only)
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/audios` - List all audios (admin only)
- `DELETE /api/admin/audios/:id` - Delete audio (admin only)
- `GET /api/admin/users/:userId/bandwidth` - User bandwidth stats (admin only)

### API Keys
- `POST /api/api-keys` - Create API key (protected)
- `GET /api/api-keys` - List user's API keys (protected)
- `PUT /api/api-keys/:id` - Update API key (protected)
- `DELETE /api/api-keys/:id` - Delete API key (protected)

### Playlists
- `POST /api/playlists` - Create playlist (protected)
- `GET /api/playlists` - Get user's playlists (protected)
- `GET /api/playlists/public` - Get public playlists (public)
- `GET /api/playlists/:id` - Get playlist details (public)
- `PUT /api/playlists/:id` - Update playlist (protected)
- `DELETE /api/playlists/:id` - Delete playlist (protected)
- `POST /api/playlists/:id/audios` - Add audios to playlist (protected)
- `DELETE /api/playlists/:id/audios/:audioId` - Remove audio (protected)
- `PUT /api/playlists/:id/order` - Update playlist order (protected)

### User Interactions
- `POST /api/interactions/favorites/:audioId` - Add favorite (protected)
- `DELETE /api/interactions/favorites/:audioId` - Remove favorite (protected)
- `GET /api/interactions/favorites` - Get favorites (protected)
- `POST /api/interactions/comments/:audioId` - Add comment (protected)
- `GET /api/interactions/comments/:audioId` - Get comments (public)
- `PUT /api/interactions/comments/:id` - Update comment (protected)
- `DELETE /api/interactions/comments/:id` - Delete comment (protected)
- `POST /api/interactions/ratings/:audioId` - Add/update rating (protected)
- `GET /api/interactions/ratings/:audioId` - Get ratings (public)

### Trash/Recycle Bin
- `GET /api/trash` - Get deleted items (protected)
- `POST /api/trash/restore/:id` - Restore deleted audio (protected)
- `DELETE /api/trash/empty` - Permanently delete all trash (protected)

## Sharing Features

### Direct Download Links
Access audio files directly using: `http://localhost:3000/d/{shareToken}`

### Embed Links
Embed audio players using: `http://localhost:3000/e/{shareToken}`

The embed page provides a clean HTML5 audio player that can be embedded in any website.

### Folder Sharing
Share entire folders with: `http://localhost:3000/f/{shareToken}`

Folders can be password-protected and support embed mode for displaying all audio files in a folder.

## Audio Encoding

The platform supports encoding audio files to different formats:
- **MP3** - With customizable bitrates (128k, 192k, 256k, 320k)
- **AAC** - Advanced Audio Coding
- **OGG Vorbis** - Open source format
- **WAV** - Lossless format

**Note:** Encoding requires ffmpeg to be installed on the server.

## Database Models

### User
- User accounts with roles (admin, user, affiliate)
- Storage tracking and limits
- Authentication credentials

### Audio
- Audio file metadata
- File storage information
- View/download statistics
- Public/private settings

### Plan
- Subscription plans with pricing
- Storage and bandwidth limits
- Feature flags

### Subscription
- User subscriptions to plans
- Billing period tracking
- Auto-renewal settings

### Affiliate
- Affiliate accounts and codes
- Commission tracking
- Referral statistics
- Payout management

### Transaction
- Payment transactions
- Subscription payments
- Affiliate commissions
- Payout requests

### Analytics
- Event tracking (views, downloads, plays)
- User engagement metrics
- Geographic data
- Device information

## Project Structure

```
├── config/
│   ├── config.js          # Application configuration
│   └── database.js        # Database configuration
├── controllers/
│   ├── authController.js
│   ├── audioController.js
│   ├── planController.js
│   ├── subscriptionController.js
│   ├── affiliateController.js
│   └── analyticsController.js
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── errorHandler.js    # Error handling
│   ├── upload.js          # File upload handling
│   └── validation.js      # Request validation
├── models/
│   ├── index.js
│   ├── User.js
│   ├── Audio.js
│   ├── Plan.js
│   ├── Subscription.js
│   ├── Affiliate.js
│   ├── Transaction.js
│   └── Analytics.js
├── routes/
│   ├── auth.js
│   ├── audio.js
│   ├── plans.js
│   ├── subscriptions.js
│   ├── affiliate.js
│   └── analytics.js
├── seeders/
│   └── 20240101000000-default-plans.js
├── server.js              # Main server file
├── package.json
└── README.md
```

## Usage Examples

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Register with Affiliate Code
```bash
curl -X POST "http://localhost:3000/api/auth/register?affiliate=AFF123456" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Upload Audio
```bash
curl -X POST http://localhost:3000/api/audio/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@/path/to/audio.mp3" \
  -F "title=My Audio Track" \
  -F "description=Description here" \
  -F "isPublic=true"
```

### Subscribe to Plan
```bash
curl -X POST http://localhost:3000/api/subscriptions/subscribe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "00000000-0000-0000-0000-000000000002"
  }'
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API routes
- Input validation and sanitization
- CORS protection
- Helmet security headers
- File type validation for uploads

## Development

### Running in Development Mode
```bash
npm run dev
```

### Database Migrations
```bash
# Run migrations
npm run db:migrate

# Reset database (WARNING: Deletes all data)
npm run db:reset
```

## Usage Examples

### Get Share Links for Audio
```bash
curl http://localhost:3000/api/share/links/{audioId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response includes:
- Direct download link: `http://localhost:3000/d/{shareToken}`
- Embed link: `http://localhost:3000/e/{shareToken}`
- Embed code: HTML iframe code

### Create Folder
```bash
curl -X POST http://localhost:3000/api/folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Music",
    "description": "My favorite tracks",
    "isPublic": false
  }'
```

### Enable Folder Sharing
```bash
curl -X POST http://localhost:3000/api/folders/{folderId}/enable-sharing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "optional-password"
  }'
```

### Encode Audio
```bash
curl -X POST http://localhost:3000/api/encoding/encode/{audioId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "mp3",
    "bitrate": "192k",
    "quality": "high"
  }'
```

### Rename Audio
```bash
curl -X PUT http://localhost:3000/api/audio/{audioId}/rename \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Audio Name"
  }'
```

## Production Considerations

1. **Environment Variables** - Never commit `.env` file
2. **Database** - Use connection pooling and proper indexing
3. **File Storage** - Consider cloud storage (AWS S3, etc.)
4. **CDN** - Use CDN for serving audio files
5. **Monitoring** - Add logging and monitoring tools
6. **Backup** - Implement database backup strategy
7. **SSL/TLS** - Use HTTPS in production
8. **Rate Limiting** - Adjust rate limits based on traffic
9. **FFmpeg** - Install ffmpeg on server for encoding features: `sudo apt-get install ffmpeg` (Ubuntu) or `brew install ffmpeg` (macOS)
10. **File Processing** - Consider using a queue system (Bull/BullMQ) for encoding tasks in production
11. **Email Configuration** - Configure SMTP settings for email features
12. **Redis** - Set up Redis for queue system (optional, for background jobs)
13. **Bandwidth Limits** - Configure bandwidth limits per plan
14. **API Keys** - Implement rate limiting per API key
15. **Soft Deletes** - Set up cron job to permanently delete old trash items

## License

ISC

## Support

For issues and questions, please open an issue in the repository.

