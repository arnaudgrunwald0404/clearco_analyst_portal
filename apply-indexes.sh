#!/bin/bash

# Database Index Application Script for Analyst Portal
# This script applies database indexes in a safe, prioritized manner

set -e  # Exit on any error

echo "🚀 Starting database index optimization for Analyst Portal..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set your DATABASE_URL before running this script"
    exit 1
fi

# Function to apply indexes with error handling
apply_indexes() {
    local tier=$1
    local sql_file=$2
    
    echo "📊 Applying $tier indexes..."
    
    if psql "$DATABASE_URL" -f "$sql_file" -v ON_ERROR_STOP=1; then
        echo "✅ $tier indexes applied successfully"
    else
        echo "❌ Error applying $tier indexes"
        return 1
    fi
}

# Function to check database connection
check_connection() {
    echo "🔍 Checking database connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database connection successful"
    else
        echo "❌ Cannot connect to database. Please check your DATABASE_URL"
        exit 1
    fi
}

# Function to show current table sizes
show_table_sizes() {
    echo "📏 Current table sizes:"
    psql "$DATABASE_URL" -c "
        SELECT 
            schemaname, 
            tablename, 
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
    "
}

# Function to show existing indexes
show_existing_indexes() {
    echo "📋 Existing indexes:"
    psql "$DATABASE_URL" -c "
        SELECT 
            schemaname, 
            tablename, 
            indexname, 
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 10;
    "
}

# Main execution
main() {
    echo "=========================================="
    echo "🔧 Analyst Portal Database Optimization"
    echo "=========================================="
    
    # Check connection
    check_connection
    
    # Show current state
    echo ""
    show_table_sizes
    echo ""
    show_existing_indexes
    echo ""
    
    # Ask for confirmation
    read -p "🤔 Do you want to proceed with applying indexes? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operation cancelled by user"
        exit 0
    fi
    
    # Apply indexes in tiers
    echo ""
    echo "🎯 Applying indexes in priority order..."
    echo ""
    
    # Tier 1: Critical indexes
    apply_indexes "Tier 1 (Critical)" "critical-indexes-priority.sql"
    
    # Wait a moment between tiers
    echo "⏳ Waiting 5 seconds before applying next tier..."
    sleep 5
    
    # Ask for Tier 2
    read -p "🤔 Apply Tier 2 (High Impact) indexes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apply_indexes "Tier 2 (High Impact)" "database-indexes-recommendations.sql"
        
        # Wait before Tier 3
        echo "⏳ Waiting 5 seconds before applying next tier..."
        sleep 5
        
        # Ask for Tier 3
        read -p "🤔 Apply Tier 3 (Optimization) indexes? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "📊 Note: Tier 3 indexes are already included in the main recommendations file"
            echo "✅ All tiers completed"
        fi
    fi
    
    echo ""
    echo "🎉 Index application completed!"
    echo ""
    
    # Show updated index information
    echo "📊 Updated index information:"
    psql "$DATABASE_URL" -c "
        SELECT 
            schemaname, 
            tablename, 
            indexname, 
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 15;
    "
    
    echo ""
    echo "💡 Next steps:"
    echo "1. Monitor query performance with pg_stat_statements"
    echo "2. Check index usage with: SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"
    echo "3. Consider running ANALYZE on large tables if needed"
    echo ""
    echo "🚀 Your database should now be significantly faster!"
}

# Run main function
main
