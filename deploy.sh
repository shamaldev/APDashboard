#!/bin/bash

# AP Dashboard Deployment Script for GCP VM
# This script builds and deploys the frontend application

set -e  # Exit on error

echo "======================================"
echo "AP Dashboard Deployment Script"
echo "======================================"

# Configuration
APP_NAME="ap-dashboard"
DEPLOY_DIR="/var/www/$APP_NAME"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$APP_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run with sudo"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Using default values."
fi

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Install dependencies
print_status "Installing npm dependencies..."
npm install

# Build the application
print_status "Building application..."
npm run build

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p "$DEPLOY_DIR"

# Copy built files
print_status "Copying built files to $DEPLOY_DIR..."
rm -rf "$DEPLOY_DIR/dist"
cp -r dist "$DEPLOY_DIR/"

# Set proper permissions
print_status "Setting permissions..."
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"

# Configure Nginx
print_status "Configuring Nginx..."
cp nginx.conf "$NGINX_CONF"

# Enable site
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s "$NGINX_CONF" "$NGINX_ENABLED"
fi

# Remove default nginx site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
print_status "Testing Nginx configuration..."
nginx -t

# Restart Nginx
print_status "Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Configure firewall if ufw is installed
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw allow 'Nginx Full'
fi

echo ""
echo "======================================"
print_status "Deployment completed successfully!"
echo "======================================"
echo ""
echo "Your application is now running at:"
echo "  http://$(curl -s ifconfig.me)"
echo ""
echo "To view Nginx logs:"
echo "  sudo tail -f /var/log/nginx/access.log"
echo "  sudo tail -f /var/log/nginx/error.log"
echo ""
