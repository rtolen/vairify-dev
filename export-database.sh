#!/bin/bash

# Database Export Script for Supabase
# Usage: ./export-database.sh [schema|data|full|tables]

EXPORT_TYPE=${1:-full}
OUTPUT_FILE="database_export_$(date +%Y%m%d_%H%M%S).sql"

echo "🗄️  Vairify Database Export Script"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  brew install supabase/tap/supabase"
    echo "  OR"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked to Supabase"
    echo ""
    echo "Link your project with:"
    echo "  supabase link --project-ref jgwmxzgeropjxwonnruz"
    echo ""
    exit 1
fi

echo "📦 Export type: $EXPORT_TYPE"
echo "📄 Output file: $OUTPUT_FILE"
echo ""

case $EXPORT_TYPE in
    schema)
        echo "Exporting schema only..."
        supabase db dump --schema-only -f "$OUTPUT_FILE"
        ;;
    data)
        echo "Exporting data only..."
        supabase db dump --data-only -f "$OUTPUT_FILE"
        ;;
    tables)
        echo "Exporting specific tables..."
        echo "Enter table names (space-separated):"
        read -r TABLES
        supabase db dump -t $TABLES -f "$OUTPUT_FILE"
        ;;
    full)
        echo "Exporting full database (schema + data)..."
        supabase db dump -f "$OUTPUT_FILE"
        ;;
    *)
        echo "❌ Invalid export type: $EXPORT_TYPE"
        echo ""
        echo "Usage: ./export-database.sh [schema|data|full|tables]"
        echo ""
        echo "Options:"
        echo "  schema  - Export schema only (CREATE TABLE statements)"
        echo "  data    - Export data only (INSERT statements)"
        echo "  full    - Export everything (default)"
        echo "  tables  - Export specific tables (interactive)"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Export completed successfully!"
    echo "📁 File saved to: $OUTPUT_FILE"
    echo ""
    ls -lh "$OUTPUT_FILE"
else
    echo ""
    echo "❌ Export failed!"
    exit 1
fi


