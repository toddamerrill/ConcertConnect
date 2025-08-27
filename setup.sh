#!/bin/bash

echo "🚀 Setting up Concert Connect development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You can still run manually, but Docker setup won't work."
fi

# Create environment files
echo "📄 Creating environment files..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists"
fi

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
else
    echo "⚠️  backend/.env file already exists"
fi

if [ ! -f "web/.env.local" ]; then
    cp .env.example web/.env.local
    echo "✅ Created web/.env.local file"
else
    echo "⚠️  web/.env.local file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."

echo "Installing root dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend && npm install
cd ..

echo "Installing web dependencies..."
cd web && npm install
cd ..

echo "Installing shared dependencies..."
cd shared && npm install && npm run build
cd ..

echo "Installing mobile dependencies (if you have Expo CLI)..."
if command -v expo &> /dev/null; then
    cd mobile && npm install
    cd ..
else
    echo "⚠️  Expo CLI not found. Install with: npm install -g @expo/cli"
    echo "   Then run: cd mobile && npm install"
fi

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit your .env files with your API keys:"
echo "   - Ticketmaster API key"
echo "   - Stripe keys"
echo "   - Database connection string"
echo ""
echo "2. Start the development environment:"
echo "   Option A - Using Docker:"
echo "   $ docker compose up -d"
echo ""
echo "   Option B - Manual startup:"
echo "   $ cd backend && npm run dev     # Terminal 1"
echo "   $ cd web && npm run dev         # Terminal 2"
echo "   $ cd mobile && npm start        # Terminal 3 (optional)"
echo ""
echo "3. Initialize the database:"
echo "   $ cd backend && npm run db:migrate && npm run db:seed"
echo ""
echo "4. Access the application:"
echo "   - Web: http://localhost:3000"
echo "   - API: http://localhost:3001"
echo "   - API Health: http://localhost:3001/health"
echo ""
echo "📚 Check README.md for detailed documentation!"