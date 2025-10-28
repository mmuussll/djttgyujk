// وظائف مساعدة للاتصال بـ Supabase

// وظائف المستخدمين
async function getUsers() {
    const { data, error } = await window.supabase
        .from('users')
        .select('*');
    if (error) {
        console.error('Error getting users:', error);
        throw error;
    }
    return data;
}

async function addUser(username, password, role) {
    // أولاً نحتاج إلى تسجيل المستخدم في نظام مصادقة Supabase
    const { data: authData, error: authError } = await window.supabase.auth.signUp({
        email: username, // سنستخدم البريد الإلكتروني كاسم مستخدم
        password: password,
    });
    
    if (authError) {
        // إذا كان المستخدم موجودًا بالفعل، نسجله دخولًا
        if (authError.code === 'user_already_exists') {
            console.log('User already exists, proceeding to add to users table');
        } else {
            console.error('Auth error:', authError);
            throw authError;
        }
    }
    
    // ثم نضيف المستخدم إلى جدول المستخدمين
    const { data, error } = await window.supabase
        .from('users')
        .insert([{ username: username, password: password, role: role }]);
    if (error) {
        console.error('Error adding user to table:', error);
        throw error;
    }
    return data;
}

// وظائف الزبائن
async function getCustomers() {
    const { data, error } = await window.supabase
        .from('customers')
        .select('*');
    if (error) {
        console.error('Error getting customers:', error);
        throw error;
    }
    return data;
}

async function addCustomer(name, phone, address) {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const { data, error } = await window.supabase
        .from('customers')
        .insert([{ name: name, phone: phone, address: address, created_by: userId }]);
    if (error) {
        console.error('Error adding customer:', error);
        throw error;
    }
    return data;
}

// وظائف الديون
async function getDebts() {
    const { data, error } = await window.supabase
        .from('debts')
        .select(`
            id,
            amount,
            description,
            date,
            status,
            customer_id,
            customers(name)
        `);
    if (error) {
        console.error('Error getting debts:', error);
        throw error;
    }
    return data;
}

async function addDebt(customerId, amount, description, date) {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const { data, error } = await window.supabase
        .from('debts')
        .insert([{ customer_id: customerId, amount: amount, description: description, date: date, created_by: userId }]);
    if (error) {
        console.error('Error adding debt:', error);
        throw error;
    }
    return data;
}

// وظائف السدادات
async function getPayments() {
    const { data, error } = await window.supabase
        .from('payments')
        .select(`
            id,
            amount,
            date,
            debt_id,
            debts(amount, customers(name))
        `);
    if (error) {
        console.error('Error getting payments:', error);
        throw error;
    }
    return data;
}

async function addPayment(debtId, amount, date) {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    
    const { data, error } = await window.supabase
        .from('payments')
        .insert([{ debt_id: debtId, amount: amount, date: date, created_by: userId }]);
    if (error) {
        console.error('Error adding payment:', error);
        throw error;
    }
    return data;
}

// وظيفة للحصول على معرف المستخدم الحالي
async function getCurrentUserId() {
    const { data: { session } } = await window.supabase.auth.getSession();
    return session?.user?.id || null;
}