#!/bin/bash

# New Account Setup Script
# This script initializes a new vendor account with all necessary data and configurations

echo "🚀 New Account Setup"
echo "===================="
echo ""
echo "This script will:"
echo "1. Create a new vendor domain"
echo "2. Create an admin user with magic link"
echo "3. Duplicate analysts, events, and awards from clearcompany.com"
echo "4. Assign vendor domain to all necessary objects"
echo "5. Restrict analyst portal access"
echo "6. Build company profile"
echo "7. Run comprehensive tests"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed or not in PATH"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Run the initialization script
echo "Starting initialization..."
echo ""

node scripts/initialize-new-account.js

echo ""
echo "Setup complete! Check the output above for results and next steps."






