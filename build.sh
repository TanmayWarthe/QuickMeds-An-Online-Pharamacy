#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🚀 Starting QuickMeds deployment build..."

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "🗄️  Running database migrations..."
python manage.py migrate --noinput

# Create admin user from environment variables
echo "👤 Creating admin user..."
python manage.py create_admin

echo "✅ Build completed successfully!"
