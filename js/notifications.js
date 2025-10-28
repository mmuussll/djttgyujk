// وظيفة للحصول على الديون المستحقة
async function getPendingDebts() {
    const { data, error } = await window.supabase
        .from('debts')
        .select(`
            id,
            amount,
            description,
            date,
            customers(name, phone)
        `)
        .eq('status', 'pending');
    
    if (error) {
        console.error('Error getting pending debts:', error);
        return [];
    }
    
    return data;
}

// وظيفة للتحقق من الديون المستحقة وعرض تنبيهات
async function checkPendingDebts() {
    const pendingDebts = await getPendingDebts();
    
    // عرض عدد الديون المستحقة في شريط التنقل
    const notificationCount = pendingDebts.length;
    updateNotificationBadge(notificationCount);
    
    // عرض تنبيهات للديون المتأخرة
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueDebts = pendingDebts.filter(debt => {
        const debtDate = new Date(debt.date);
        return debtDate < today;
    });
    
    // عرض تنبيهات الديون المتأخرة
    if (overdueDebts.length > 0) {
        showOverdueDebtNotifications(overdueDebts);
    }
    
    // حفظ الإشعارات في قاعدة البيانات إذا لزم الأمر
    await saveOverdueNotifications(overdueDebts);
}

// وظيفة لتحديث شارة الإشعارات
function updateNotificationBadge(count) {
    const notificationBadge = document.getElementById('notification-badge');
    if (notificationBadge) {
        if (count > 0) {
            notificationBadge.textContent = count;
            notificationBadge.style.display = 'inline-block';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
}

// وظيفة لعرض تنبيهات الديون المتأخرة
function showOverdueDebtNotifications(overdueDebts) {
    // عرض تنبيه في الزاوية العلوية للصفحة
    if (overdueDebts.length > 0) {
        const message = `لديك ${overdueDebts.length} دين متأخر!`;
        
        // إنشاء عنصر التنبيه
        let notificationEl = document.getElementById('overdue-notification');
        if (!notificationEl) {
            notificationEl = document.createElement('div');
            notificationEl.id = 'overdue-notification';
            notificationEl.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                background: #dc3545;
                color: white;
                padding: 15px;
                border-radius: 5px;
                z-index: 9999;
                box-shadow: 0 4px 8px rgba(0,0,0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const messageEl = document.createElement('span');
            messageEl.textContent = message;
            notificationEl.appendChild(messageEl);
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                margin-left: 10px;
            `;
            closeBtn.onclick = () => {
                notificationEl.style.display = 'none';
            };
            notificationEl.appendChild(closeBtn);
            
            document.body.appendChild(notificationEl);
        } else {
            notificationEl.querySelector('span').textContent = message;
            notificationEl.style.display = 'flex';
        }
    }
}

// وظيفة لحفظ الإشعارات في قاعدة البيانات
async function saveOverdueNotifications(overdueDebts) {
    for (const debt of overdueDebts) {
        // التحقق مما إذا كان هناك إشعار مماثل لم يُقرأ بعد
        const { data: existingNotification } = await window.supabase
            .from('notifications')
            .select('id')
            .eq('debt_id', debt.id)
            .eq('is_read', false)
            .single();
        
        if (!existingNotification) {
            // إنشاء إشعار جديد
            await window.supabase
                .from('notifications')
                .insert([{
                    title: 'دين متأخر',
                    message: `الزبون ${debt.customers?.name || 'غير معروف'} لديه دين متأخر بقيمة ${debt.amount} ت.ع`,
                    customer_id: debt.customers?.id,
                    debt_id: debt.id,
                    is_read: false
                }]);
        }
    }
}

// وظيفة للحصول على الإشعارات
async function getNotifications() {
    const { data, error } = await window.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
    
    return data;
}

// وظيفة لوضع علامة على الإشعار كمقروء
async function markNotificationAsRead(notificationId) {
    const { error } = await window.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    
    if (error) {
        console.error('Error marking notification as read:', error);
    } else {
        // تحديث شارة الإشعارات
        checkPendingDebts();
    }
}

// وظيفة لوضع علامة على جميع الإشعارات كمقروءة
async function markAllNotificationsAsRead() {
    const { error } = await window.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
    
    if (error) {
        console.error('Error marking all notifications as read:', error);
    } else {
        // تحديث شارة الإشعارات
        checkPendingDebts();
    }
}

// بدء التحقق من الديون المستحقة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من الديون المستحقة فور تحميل الصفحة
    checkPendingDebts();
    
    // التحقق من الديون كل 5 دقائق (30000 مللي ثانية)
    setInterval(checkPendingDebts, 300000);
});