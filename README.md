# Concert Connect 🎵

[![CI/CD Pipeline](https://github.com/toddamerrill/ConcertConnect/actions/workflows/ci.yml/badge.svg)](https://github.com/toddamerrill/ConcertConnect/actions/workflows/ci.yml)
[![Security Audit](https://github.com/toddamerrill/ConcertConnect/actions/workflows/security.yml/badge.svg)](https://github.com/toddamerrill/ConcertConnect/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

Concert Connect is a cross-platform application that combines concert ticket purchasing, AI-powered music discovery, and social networking features.

## 🎯 Phase 1 MVP Features

- ✅ User authentication (email/password registration and login)
- ✅ Event discovery via Ticketmaster API integration
- ✅ Basic social features (profiles, friends, posts)
- ✅ Event interest tracking (interested, going, purchased)
- ✅ Stripe payment integration for ticket purchases
- ✅ Cross-platform web and mobile applications
- ✅ Real-time data synchronization

## 🏗️ Architecture

### Backend (Node.js + Express)
- RESTful API with TypeScript
- PostgreSQL database with Prisma ORM
- Redis for caching and sessions
- JWT authentication
- Stripe payment processing
- Ticketmaster API integration

### Web App (Next.js)
- React with TypeScript
- NextAuth.js for authentication
- Tailwind CSS for styling
- Responsive design

### Mobile App (React Native + Expo)
- Cross-platform iOS/Android support
- Redux Toolkit for state management
- React Native Paper for UI components
- Secure token storage

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- Docker (optional)

### Quick Start with Docker

1. **Clone the repository**:
```bash
git clone https://github.com/toddamerrill/ConcertConnect.git
cd ConcertConnect
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker-compose up -d
```

4. Initialize the database:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

The application will be available at:
- Web App: http://localhost:3000
- API: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:migrate
npm run db:seed
npm run dev
```

#### Web App Setup
```bash
cd web
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

#### Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```

## 📱 Demo Users

The seed script creates test users:

**User 1:**
- Email: john@example.com
- Password: password123

**User 2:**
- Email: jane@example.com
- Password: password123

## 🔧 Configuration

### Required API Keys

1. **Ticketmaster API** - For event discovery
   - Get API key from: https://developer.ticketmaster.com/
   - Add to `TICKETMASTER_API_KEY`

2. **Stripe** - For payment processing
   - Get keys from: https://dashboard.stripe.com/
   - Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **Google OAuth** (Optional) - For social login
   - Get credentials from: https://console.cloud.google.com/
   - Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Environment Variables

Check `.env.example` for all required environment variables.

## 🧪 Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linter
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Prisma Studio
```

### Web
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run test         # Run tests
```

### Mobile
```bash
npm start            # Start Expo development server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run on web
```

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users** - User accounts and profiles
- **Events** - Concert and event information
- **UserEvents** - User interactions with events (interested, going, purchased)
- **Friendships** - Social connections between users
- **SocialPosts** - User posts and content
- **Payments** - Payment transactions
- **RestaurantPartners** - Local business partnerships

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me` - Update user profile

### Events
- `GET /api/events/search` - Search events
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/interest` - Mark event interest
- `GET /api/events/featured/upcoming` - Get featured events

### Social
- `POST /api/social/friends/request` - Send friend request
- `GET /api/social/friends` - Get user's friends
- `POST /api/social/posts` - Create social post
- `GET /api/social/posts` - Get social feed

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `GET /api/payments/history` - Get payment history

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Secure cookie configuration

## 🎨 UI/UX Features

- Responsive design for all screen sizes
- Material Design components (mobile)
- Tailwind CSS utility classes (web)
- Dark/light theme support
- Accessibility compliance
- Loading states and error handling

## 📈 Monitoring & Logging

- Winston logging with structured logs
- Error tracking and monitoring
- API request/response logging
- Performance monitoring
- Health check endpoints

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run all services
docker-compose up --build

# Run in production mode
docker-compose -f docker-compose.prod.yml up
```

### Manual Deployment
1. Set up PostgreSQL and Redis instances
2. Configure environment variables
3. Build and deploy backend API
4. Build and deploy web application
5. Build mobile app for app stores

## 🛣️ Roadmap

### Phase 2 (Planned)
- Restaurant partnerships with QR codes
- Enhanced social features (groups, meetups, chat)
- Basic AI recommendations
- Push notifications

### Phase 3 (Planned)
- Travel integration (hotels, transportation)
- Advanced AI with machine learning models
- Premium features and subscriptions
- Analytics dashboard

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before getting started.

### Quick Contribution Steps

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/toddamerrill/ConcertConnect.git
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and add tests
5. **Follow our coding standards** (see CONTRIBUTING.md)
6. **Run tests and linting**:
   ```bash
   npm run test
   npm run lint
   ```
7. **Commit using conventional commits**:
   ```bash
   git commit -m "feat: add new feature description"
   ```
8. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
9. **Create a Pull Request** on GitHub

### Development Resources

- [Contributing Guidelines](CONTRIBUTING.md) - Detailed contribution instructions
- [Security Policy](SECURITY.md) - How to report security vulnerabilities
- [Issue Templates](.github/ISSUE_TEMPLATE/) - Bug reports and feature requests
- [Pull Request Template](.github/pull_request_template.md) - PR checklist and guidelines

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

### GitHub Resources
- 🐛 **Bug Reports**: [Create a bug report](https://github.com/toddamerrill/ConcertConnect/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Request a feature](https://github.com/toddamerrill/ConcertConnect/issues/new?template=feature_request.md)
- 📖 **Documentation**: Check our [Contributing Guidelines](CONTRIBUTING.md)
- 🔒 **Security Issues**: See our [Security Policy](SECURITY.md)

### Community
- 💬 **Discussions**: [GitHub Discussions](https://github.com/toddamerrill/ConcertConnect/discussions)
- 📧 **Email**: support@concertconnect.com (for private inquiries)

### Documentation
- 📚 **API Documentation**: Available at `/api/docs` when running locally
- 🔧 **Setup Guide**: See [Getting Started](#getting-started) section
- 🏗️ **Architecture**: Check the technical design document

## 🏗️ Built With

- **Backend**: Node.js, Express.js, TypeScript, Prisma, PostgreSQL, Redis
- **Web**: Next.js, React, TypeScript, Tailwind CSS, NextAuth.js
- **Mobile**: React Native, Expo, Redux Toolkit, React Native Paper
- **Payment**: Stripe
- **APIs**: Ticketmaster, Spotify Web API
- **Infrastructure**: Docker, Docker Compose