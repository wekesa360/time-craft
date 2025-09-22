#!/bin/bash

# Database Migration Runner for Time & Wellness Application
# This script runs all migrations in the correct order

set -e  # Exit on any error

# Configuration
DB_PATH="${DB_PATH:-./database.db}"
MIGRATIONS_DIR="$(dirname "$0")"
LOG_FILE="${MIGRATIONS_DIR}/migration.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if database exists
check_database() {
    if [ ! -f "$DB_PATH" ]; then
        log "Database not found at $DB_PATH. Creating new database..."
        touch "$DB_PATH"
    fi
}

# Check if sqlite3 is available
check_sqlite() {
    if ! command -v sqlite3 &> /dev/null; then
        error "sqlite3 command not found. Please install SQLite3."
        exit 1
    fi
}

# Create migrations tracking table
init_migrations_table() {
    log "Initializing migrations tracking table..."
    sqlite3 "$DB_PATH" <<EOF
CREATE TABLE IF NOT EXISTS migrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at INTEGER NOT NULL,
    checksum TEXT
);
EOF
}

# Check if migration has been applied
is_migration_applied() {
    local migration_id="$1"
    local count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM migrations WHERE id = '$migration_id';")
    [ "$count" -gt 0 ]
}

# Calculate file checksum
calculate_checksum() {
    local file="$1"
    if command -v md5sum &> /dev/null; then
        md5sum "$file" | cut -d' ' -f1
    elif command -v md5 &> /dev/null; then
        md5 -q "$file"
    else
        # Fallback to file size and modification time
        stat -c "%s-%Y" "$file" 2>/dev/null || stat -f "%z-%m" "$file"
    fi
}

# Run a single migration
run_migration() {
    local migration_file="$1"
    local migration_id=$(basename "$migration_file" .sql)
    local migration_name=$(basename "$migration_file")
    
    log "Running migration: $migration_name"
    
    # Check if already applied
    if is_migration_applied "$migration_id"; then
        warning "Migration $migration_id already applied, skipping..."
        return 0
    fi
    
    # Calculate checksum
    local checksum=$(calculate_checksum "$migration_file")
    
    # Run the migration
    if sqlite3 "$DB_PATH" < "$migration_file"; then
        # Record migration as applied
        sqlite3 "$DB_PATH" <<EOF
INSERT INTO migrations (id, name, applied_at, checksum) 
VALUES ('$migration_id', '$migration_name', $(date +%s), '$checksum');
EOF
        success "Migration $migration_id applied successfully"
    else
        error "Migration $migration_id failed"
        return 1
    fi
}

# Show migration status
show_status() {
    log "Migration Status:"
    echo "=================="
    sqlite3 "$DB_PATH" <<EOF
SELECT 
    id,
    name,
    datetime(applied_at, 'unixepoch') as applied_at,
    checksum
FROM migrations 
ORDER BY applied_at;
EOF
}

# Main function
main() {
    log "Starting database migrations..."
    log "Database: $DB_PATH"
    log "Migrations directory: $MIGRATIONS_DIR"
    
    # Pre-flight checks
    check_sqlite
    check_database
    
    # Initialize migrations table
    init_migrations_table
    
    # Get list of migration files in order
    local migration_files=(
        "001_init.sql"
        "002_enhanced_schema.sql"
        "003_eisenhower_matrix.sql"
        "004_fix_missing_columns.sql"
        "005_high_priority_features.sql"
        "006_voice_processing.sql"
        "007_health_insights.sql"
        "008_social_features.sql"
        "009_localization_admin.sql"
        "010_seed_data.sql"
    )
    
    # Run migrations
    local success_count=0
    local total_count=${#migration_files[@]}
    
    for migration_file in "${migration_files[@]}"; do
        local full_path="$MIGRATIONS_DIR/$migration_file"
        
        if [ -f "$full_path" ]; then
            if run_migration "$full_path"; then
                ((success_count++))
            else
                error "Migration failed: $migration_file"
                log "Stopping migration process due to error"
                break
            fi
        else
            error "Migration file not found: $full_path"
            break
        fi
    done
    
    # Summary
    echo ""
    log "Migration Summary:"
    log "=================="
    log "Total migrations: $total_count"
    log "Successful: $success_count"
    log "Failed: $((total_count - success_count))"
    
    if [ $success_count -eq $total_count ]; then
        success "All migrations completed successfully!"
        show_status
    else
        error "Some migrations failed. Check the log for details."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "status")
        check_database
        show_status
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [status|help]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Run all pending migrations"
        echo "  status     Show migration status"
        echo "  help       Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  DB_PATH    Path to SQLite database file (default: ./database.db)"
        ;;
    "")
        main
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
