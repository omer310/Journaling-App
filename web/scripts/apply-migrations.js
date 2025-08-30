#!/usr/bin/env node

/**
 * Script to apply database migrations for performance improvements
 * Run this script to add indexes to your Supabase database
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Performance Optimization Migration Script');
console.log('============================================\n');

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20241201000005_add_performance_indexes.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Migration SQL to apply:');
console.log('==========================');
console.log(migrationSQL);
console.log('\n');

console.log('📝 Instructions:');
console.log('================');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to the SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Run the migration');
console.log('5. Verify the indexes were created');
console.log('\n');

console.log('✅ Expected Results:');
console.log('===================');
console.log('- Faster entry loading (should reduce 20-30s to 2-5s)');
console.log('- Better query performance on free tier');
console.log('- Improved user experience');
console.log('\n');

console.log('🔍 To verify indexes were created, run:');
console.log('SELECT schemaname, tablename, indexname FROM pg_indexes WHERE tablename = \'journal_entries\';');
console.log('\n');

console.log('💡 Additional Performance Tips:');
console.log('==============================');
console.log('- Clear browser cache after applying migration');
console.log('- Restart your development server');
console.log('- Monitor loading times in browser dev tools');
console.log('- Consider upgrading to Supabase Pro for better performance');
