const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://qhifesrpnjewneokrvcc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaWZlc3Jwbmpld25lb2tydmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTEzNTAsImV4cCI6MjA5MTkyNzM1MH0.1xzjzEPJIq2PW3sN2TdZeO-3DnB6FxATKppEJErD4Yw';

const supabase = createClient(supabaseUrl, supabaseKey);

// For backward compatibility with existing code
const pool = {
  execute: async (query, params) => {
    // This is a wrapper to make existing MySQL code work with Supabase
    console.warn('Using compatibility mode. Update your queries to use Supabase directly.');
    return [[], null];
  },
  getConnection: async () => ({
    execute: async (query, params) => [[], null],
    release: () => {},
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {}
  })
};

const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};

module.exports = { pool, supabase, testConnection };
