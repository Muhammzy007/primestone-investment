const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://qhifesrpnjewneokrvcc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaWZlc3Jwbmpld25lb2tydmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTEzNTAsImV4cCI6MjA5MTkyNzM1MH0.1xzjzEPJIq2PW3sN2TdZeO-3DnB6FxATKppEJErD4Yw';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
