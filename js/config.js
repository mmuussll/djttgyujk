// التحقق من تحميل مكتبة Supabase
if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Please check the script tag in your HTML files.');
}

const SUPABASE_URL = 'https://zaktmjnjukkualktkxsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpha3Rtam5qdWtrdWFsa3RreHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDc5ODgsImV4cCI6MjA3NzIyMzk4OH0.nXAVJqYocUsugL--GypLAdfKw1GK3_D6y7kKNmPEFOY';

// إنشاء العميل بعد التأكد من أن المكتبة محملة
let supabaseClient;
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('Failed to initialize Supabase client');
}

// تصدير العميل للاستخدام في الملفات الأخرى
window.supabase = supabaseClient;