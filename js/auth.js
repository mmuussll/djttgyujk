const loginLogoutLink = document.getElementById('login-logout-link');

// تحقق من حالة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) {
        // المستخدم مسجل دخوله
        loginLogoutLink.textContent = 'تسجيل الخروج';
        loginLogoutLink.href = '#';
        loginLogoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await window.supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    } else {
        // المستخدم غير مسجل دخوله
        loginLogoutLink.textContent = 'تسجيل الدخول';
        loginLogoutLink.href = 'login.html';
    }
});

// وظيفة تسجيل الدخول باستخدام Supabase Auth
async function signIn(email, password) {
    const { data, error } = await window.supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    if (error) {
        console.error('Error signing in:', error);
        return { error };
    }
    
    // بعد تسجيل الدخول بنجاح، نحتاج للحصول على دور المستخدم من جدول المستخدمين
    const { data: userData, error: userError } = await window.supabase
        .from('users')
        .select('role')
        .eq('username', email) // نفترض أن البريد الإلكتروني هو نفسه اسم المستخدم
        .single();
    
    if (userError) {
        console.error('Error getting user role:', userError);
        // في حالة عدم العثور على المستخدم في جدول المستخدمين، نعتبره غير مصرح له
        await window.supabase.auth.signOut();
        return { error: { message: 'المستخدم غير مسجل في النظام' } };
    }
    
    // نخزن دور المستخدم في sessionStorage
    sessionStorage.setItem('userRole', userData.role);
    
    return { data };
}

// وظيفة للحصول على معرف المستخدم الحالي
async function getCurrentUserId() {
    const { data: { session } } = await window.supabase.auth.getSession();
    return session?.user?.id || null;
}

// وظيفة للحصول على البريد الإلكتروني للمستخدم الحالي
function getCurrentUserEmail() {
    const { data: { session } } = window.supabase.auth.getSession();
    return session?.user?.email || null;
}

// وظيفة للتحقق من دور المستخدم
async function getUserRole() {
    const email = getCurrentUserEmail();
    if (!email) return null;
    
    const { data, error } = await window.supabase
        .from('users')
        .select('role')
        .eq('username', email)
        .single();
    
    if (error) {
        console.error('Error getting user role:', error);
        return null;
    }
    
    return data.role;
}

// وظيفة للتحقق مما إذا كان المستخدم هو المدير
async function isAdmin() {
    const role = await getUserRole();
    return role === 'admin';
}