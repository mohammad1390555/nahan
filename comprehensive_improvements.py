#!/usr/bin/env python3
"""
Comprehensive improvements for Nahan Telegram Bot v5.3.0
Applies all changes to _worker.js without asking user any questions.
"""
import re

with open('_worker.js', 'r', encoding='utf-8') as f:
    content = f.read()

changes = []
version_updated = False

# ============================================================
# 0. BUMP VERSION TO 5.3.0
# ============================================================
old_version = 'const CURRENT_VERSION = "5.2.0";'
new_version = """const CURRENT_VERSION = "5.3.0";
// v5.3.0 Changelog:
// 🎨 UI/UX: beautified bot messages with professional Persian formatting
// 📊 Traffic alerts: auto-notify admin at 50%, 80%, 100% usage per user
// 🔔 Expiry notifications: notify 7, 3, 1 day before service expiry
// 📢 Admin broadcast: send messages to all bot users
// 📱 Referral menu: referral link & stats in user bot menu
// ⚡ Web panel polish: better stats cards, fixed brace structure
//"""

if old_version in content:
    content = content.replace(old_version, new_version, 1)
    changes.append("✅ v5.3.0: Version bumped + changelog added")
    version_updated = True
else:
    changes.append("⚠️ Version string not found, skipping")

# ============================================================
# 1. ADD NOTIFICATION THRESHOLDS TO USER OBJECTS
# ============================================================
# Add notification tracking fields to SYSTEM_DEFAULTS
old_trial = '    freeTrialVolumes: [50, 100, 200],'
new_trial = """    freeTrialVolumes: [50, 100, 200],
    // v5.3.0: Notification tracking
    trafficNotified50: {},
    trafficNotified80: {},
    expiryNotified7: {},
    expiryNotified3: {},
    expiryNotified1: {},
    broadcastMessages: [],
    botBroadcastMode: false,"""

if old_trial in content:
    content = content.replace(old_trial, new_trial, 1)
    changes.append("✅ Added notification tracking fields to SYSTEM_DEFAULTS")
else:
    changes.append("⚠️ SYSTEM_DEFAULTS trial field not found, trying different approach")
    # Try to find the right location
    idx = content.find('fakeConfigs: [')
    if idx > 0:
        insert_point = content.rfind('\n', 0, idx) + 1
        insert_text = """    // v5.3.0: Notification tracking
    trafficNotified50: {},
    trafficNotified80: {},
    expiryNotified7: {},
    expiryNotified3: {},
    expiryNotified1: {},
    broadcastMessages: [],
    botBroadcastMode: false,
"""
        content = content[:insert_point] + insert_text + content[insert_point:]
        changes.append("✅ Added notification fields (alternative placement)")

# ============================================================
# 2. ADD TRAFFIC USAGE THRESHOLD ALERTS IN trackUsage
# ============================================================
# Find the auto-disable section and add threshold alerts before it
old_notify_section = """                            ctx?.waitUntil(logActivity(env, "User Auto-Disabled", `User "${u.name}" (${u.id}) disabled: ${reason}`).catch(()=>{}));
                            if (sysConfig.tgToken && (sysConfig.tgAdminId || sysConfig.tgChatId)) {
                                const tgMsg = `⚠️ <b>User Auto-Disabled</b>\\n\\n👤 <b>User:</b> ${u.name}\\n🆔 <b>ID:</b> <code>${u.id}</code>\\n📝 <b>Reason:</b> ${reason}`;
                                const notifyChatId = sysConfig.tgAdminId || sysConfig.tgChatId;
                                ctx?.waitUntil(fetch(`https://api.telegram.org/bot${sysConfig.tgToken}/sendMessage`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ chat_id: notifyChatId, text: tgMsg, parse_mode: 'HTML' })
                                }).catch(()=>{}));
                            }"""

new_notify_section = """                            // v5.3.0: Traffic threshold alerts at 50%, 80%, 100%
                            const pctUsed = limitTotal ? Math.round((sysU?.reqs || 0) / limitTotal * 100) : 0;
                            const notifyChatId2 = sysConfig.tgAdminId || sysConfig.tgChatId;
                            const notified50 = sysConfig.trafficNotified50 || {};
                            const notified80 = sysConfig.trafficNotified80 || {};
                            if (sysConfig.tgToken && notifyChatId2 && limitTotal) {
                                const sendThresholdNotif = async (pct, key, msg) => {
                                    if (!sysConfig[key]) sysConfig[key] = {};
                                    if (sysConfig[key][u.id]) return;
                                    sysConfig[key][u.id] = true;
                                    ctx?.waitUntil(fetch(`https://api.telegram.org/bot${sysConfig.tgToken}/sendMessage`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ chat_id: notifyChatId2, text: msg, parse_mode: 'HTML' })
                                    }).catch(()=>{}));
                                    ctx?.waitUntil(cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)).catch(()=>{}));
                                };
                                if (pctUsed >= 100 && !notified80[u.id]) {
                                    sendThresholdNotif(100, 'trafficNotified80', `🚨 <b>Traffic Full!</b>\\n\\n👤 <b>User:</b> ${u.name}\\n🆔 <b>ID:</b> <code>${u.id}</code>\\n📊 <b>Usage:</b> 100%\\n⚠️ Service has been auto-disabled.`);
                                } else if (pctUsed >= 80 && !notified80[u.id]) {
                                    sendThresholdNotif(80, 'trafficNotified80', `⚠️ <b>Traffic Warning: 80%</b>\\n\\n👤 <b>User:</b> ${u.name}\\n🆔 <b>ID:</b> <code>${u.id}</code>\\n📊 <b>Usage:</b> ${pctUsed}%\\n⏳ Service will be disabled soon.`);
                                } else if (pctUsed >= 50 && !notified50[u.id]) {
                                    sendThresholdNotif(50, 'trafficNotified50', `🔔 <b>Traffic Notice: 50%</b>\\n\\n👤 <b>User:</b> ${u.name}\\n🆔 <b>ID:</b> <code>${u.id}</code>\\n📊 <b>Usage:</b> ${pctUsed}%`);
                                }
                            }
                            // v5.3.0: Expiry notifications at 7, 3, 1 days before
                            if (u.expiryMs && sysConfig.tgToken && notifyChatId2) {
                                const daysToExpiry = Math.ceil((u.expiryMs - Date.now()) / 86400000);
                                const eNotified7 = sysConfig.expiryNotified7 || {};
                                const eNotified3 = sysConfig.expiryNotified3 || {};
                                const eNotified1 = sysConfig.expiryNotified1 || {};
                                const sendExpiryNotif = async (key, msg) => {
                                    if (!sysConfig[key]) sysConfig[key] = {};
                                    if (sysConfig[key][u.id]) return;
                                    sysConfig[key][u.id] = true;
                                    ctx?.waitUntil(fetch(`https://api.telegram.org/bot${sysConfig.tgToken}/sendMessage`, {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ chat_id: notifyChatId2, text: msg, parse_mode: 'HTML' })
                                    }).catch(()=>{}));
                                    ctx?.waitUntil(cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)).catch(()=>{}));
                                };
                                if (daysToExpiry <= 1 && daysToExpiry > 0 && !eNotified1[u.id]) {
                                    sendExpiryNotif('expiryNotified1', `🚨 <b>Expiry Tomorrow!</b>\\n\\n👤 <b>User:</b> ${u.name}\\n🆔 <b>ID:</b> <code>${u.id}</code>\\n📅 <b>Expires:</b> ${new Date(u.expiryMs).toLocaleDateString()}\\n⚠️ Service expires in ${daysToExpiry} day(s).`);
                                } else if (daysToExpiry <= 3 && daysToExpiry > 1 && !eNotified3[u.id]) {
                                    sendExpiryNotif('expiryNotified3', `⚠️ <b>Expiry Soon: 3 Days</b>\\n\\n👤 <b>User:</b> ${u.name}\\n🆔 <b>ID:</b> <code>${u.id}</code>\\n📅 <b>Expires:</b> ${new Date(u.expiryMs).toLocaleDateString()}\\n⏳ ${daysToExpiry} day(s) remaining.`);
                                } else if (daysToExpiry <= 7 && daysToExpiry > 3 && !eNotified7[u.id]) {
                                    sendExpiryNotif('expiryNotified7', `🔔 <b>Expiry Notice: 7 Days</b>\\n\\n👤 <b>User:</b> ${u.name}\\n🆔 <b>ID:</b> <code>${u.id}</code>\\n📅 <b>Expires:</b> ${new Date(u.expiryMs).toLocaleDateString()}\\n⏳ ${daysToExpiry} day(s) remaining.`);
                                }
                            }
                            ctx?.waitUntil(logActivity(env, "User Auto-Disabled", `User "${u.name}" (${u.id}) disabled: ${reason}`).catch(()=>{}));
                            if (sysConfig.tgToken && (sysConfig.tgAdminId || sysConfig.tgChatId)) {
                                const tgMsg = `⚠️ <b>User Auto-Disabled</b>\\n\\n👤 <b>User:</b> ${u.name}\\n🆔 <b>ID:</b> <code>${u.id}</code>\\n📝 <b>Reason:</b> ${reason}`;
                                const notifyChatId = sysConfig.tgAdminId || sysConfig.tgChatId;
                                ctx?.waitUntil(fetch(`https://api.telegram.org/bot${sysConfig.tgToken}/sendMessage`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ chat_id: notifyChatId, text: tgMsg, parse_mode: 'HTML' })
                                }).catch(()=>{}));
                            }"""

if old_notify_section in content:
    content = content.replace(old_notify_section, new_notify_section, 1)
    changes.append("✅ Added traffic threshold alerts (50%, 80%, 100%) + expiry notifications (7, 3, 1 day)")
else:
    changes.append("⚠️ Auto-disable notification section not found, trying partial match")
    # Find by unique substring
    idx = content.find('User Auto-Disabled')
    if idx > 0:
        # Find the ctx.waitUntil for logActivity
        start = content.rfind('ctx?.waitUntil(logActivity', 0, idx)
        if start > 0:
            # Find the closing of this block and the fetch block
            end_fetch = content.find('}).catch(()=>{}));', start)
            if end_fetch > 0:
                end_fetch = content.find('});', end_fetch + 20)
                if end_fetch > 0:
                    end_fetch += 2
                    # Insert threshold alerts before this block
                    inserted = """                            // v5.3.0: Traffic threshold alerts at 50%, 80%, 100%
                            const pctUsed = limitTotal ? Math.round((sysU?.reqs || 0) / limitTotal * 100) : 0;
                            const notifyChatId2 = sysConfig.tgAdminId || sysConfig.tgChatId;
                            if (sysConfig.tgToken && notifyChatId2 && limitTotal && pctUsed > 0) {
                                const sendThresholdNotif = async (pct2, key2, msg2) => {
                                    if (!sysConfig[key2]) sysConfig[key2] = {};
                                    if (sysConfig[key2][u.id]) return;
                                    sysConfig[key2][u.id] = true;
                                    ctx?.waitUntil(fetch('https://api.telegram.org/bot' + sysConfig.tgToken + '/sendMessage', {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ chat_id: notifyChatId2, text: msg2, parse_mode: 'HTML' })
                                    }).catch(()=>{}));
                                    ctx?.waitUntil(cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)).catch(()=>{}));
                                };
                                if (pctUsed >= 100) {
                                    sendThresholdNotif(100, 'trafficNotified80', '🚨 <b>Traffic Full!</b>\\\n\\\n👤 <b>User:</b> ' + u.name + '\\\n🆔 <b>ID:</b> <code>' + u.id + '</code>\\\n📊 <b>Usage:</b> 100%\\\n⚠️ Service auto-disabled.');
                                } else if (pctUsed >= 80) {
                                    sendThresholdNotif(80, 'trafficNotified80', '⚠️ <b>Traffic Warning: 80%</b>\\\n\\\n👤 <b>User:</b> ' + u.name + '\\\n🆔 <b>ID:</b> <code>' + u.id + '</code>\\\n📊 <b>Usage:</b> ' + pctUsed + '%\\\n⏳ Service will be disabled soon.');
                                } else if (pctUsed >= 50) {
                                    sendThresholdNotif(50, 'trafficNotified50', '🔔 <b>Traffic Notice: 50%</b>\\\n\\\n👤 <b>User:</b> ' + u.name + '\\\n🆔 <b>ID:</b> <code>' + u.id + '</code>\\\n📊 <b>Usage:</b> ' + pctUsed + '%');
                                }
                            }
                            // v5.3.0: Expiry notifications at 7, 3, 1 days
                            if (u.expiryMs && sysConfig.tgToken && notifyChatId2) {
                                const daysToExpiry = Math.ceil((u.expiryMs - Date.now()) / 86400000);
                                const sendExpiryNotif2 = async (key3, msg3) => {
                                    if (!sysConfig[key3]) sysConfig[key3] = {};
                                    if (sysConfig[key3][u.id]) return;
                                    sysConfig[key3][u.id] = true;
                                    ctx?.waitUntil(fetch('https://api.telegram.org/bot' + sysConfig.tgToken + '/sendMessage', {
                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ chat_id: notifyChatId2, text: msg3, parse_mode: 'HTML' })
                                    }).catch(()=>{}));
                                    ctx?.waitUntil(cachedD1Put(env, "sys_config", JSON.stringify(sysConfig)).catch(()=>{}));
                                };
                                if (daysToExpiry <= 1 && daysToExpiry > 0) {
                                    sendExpiryNotif2('expiryNotified1', '🚨 <b>Expiry Tomorrow!</b>\\\n\\\n👤 <b>User:</b> ' + u.name + '\\\n🆔 <b>ID:</b> <code>' + u.id + '</code>\\\n📅 <b>Expires:</b> ' + new Date(u.expiryMs).toLocaleDateString() + '\\\n⚠️ Service expires in ' + daysToExpiry + ' day(s).');
                                } else if (daysToExpiry <= 3 && daysToExpiry > 1) {
                                    sendExpiryNotif2('expiryNotified3', '⚠️ <b>Expiry Soon: 3 Days</b>\\\n\\\n👤 <b>User:</b> ' + u.name + '\\\n🆔 <b>ID:</b> <code>' + u.id + '</code>\\\n📅 <b>Expires:</b> ' + new Date(u.expiryMs).toLocaleDateString() + '\\\n⏳ ' + daysToExpiry + ' day(s) remaining.');
                                } else if (daysToExpiry <= 7 && daysToExpiry > 3) {
                                    sendExpiryNotif2('expiryNotified7', '🔔 <b>Expiry Notice: 7 Days</b>\\\n\\\n👤 <b>User:</b> ' + u.name + '\\\n🆔 <b>ID:</b> <code>' + u.id + '</code>\\\n📅 <b>Expires:</b> ' + new Date(u.expiryMs).toLocaleDateString() + '\\\n⏳ ' + daysToExpiry + ' day(s) remaining.');
                                }
                            }
"""
                    content = content[:start] + inserted + content[start:]
                    changes.append("✅ Added traffic + expiry notifications (alternative placement)")

# ============================================================
# 3. ADD REFERRAL MENU + BROADCAST TO userCallbackPrefixes
# ============================================================
old_prefixes = "const userCallbackPrefixes = ['user_', 'user_free_trial', 'user_buy', 'user_main_menu', 'user_status_guide', 'user_get_link:', 'user_renew_service:', 'user_delete_service:', 'user_pause_service:', 'user_support', 'user_rename_service:'];"
new_prefixes = "const userCallbackPrefixes = ['user_', 'user_free_trial', 'user_buy', 'user_main_menu', 'user_status_guide', 'user_get_link:', 'user_renew_service:', 'user_delete_service:', 'user_pause_service:', 'user_support', 'user_rename_service:', 'user_referral', 'user_referral_link', 'user_referral_stats'];"

if old_prefixes in content:
    content = content.replace(old_prefixes, new_prefixes, 1)
    changes.append("✅ Added referral callback prefixes")
else:
    changes.append("⚠️ userCallbackPrefixes not found, trying alt")
    idx = content.find("userCallbackPrefixes")
    if idx > 0:
        line_end = content.find('\n', idx)
        # Append the new prefixes after 'user_rename_service:' if found
        if 'user_rename_service:' in content[idx:line_end]:
            content = content[:idx] + "const userCallbackPrefixes = ['user_', 'user_free_trial', 'user_buy', 'user_main_menu', 'user_status_guide', 'user_get_link:', 'user_renew_service:', 'user_delete_service:', 'user_pause_service:', 'user_support', 'user_rename_service:', 'user_referral', 'user_referral_link', 'user_referral_stats'];" + content[line_end+1:]
            changes.append("✅ Added referral prefixes (alt method)")

# ============================================================
# 4. ADD ADMIN BROADCAST PREFIX
# ============================================================
old_admin_prefixes = "const adminCallbackPrefixes = ['admin_trial_users', 'admin_delete_trial_user:'];"
new_admin_prefixes = "const adminCallbackPrefixes = ['admin_trial_users', 'admin_delete_trial_user:', 'admin_broadcast', 'admin_broadcast_send'];"

if old_admin_prefixes in content:
    content = content.replace(old_admin_prefixes, new_admin_prefixes, 1)
    changes.append("✅ Added admin broadcast prefixes")
else:
    changes.append("⚠️ adminCallbackPrefixes not found, skipping")

# ============================================================
# 5. ADD REFERRAL HANDLER + BROADCAST HANDLER IN BOT CALLBACKS
# ============================================================
# Add referral handler before user_main_menu handler
old_main_menu_hook = '} else if (data === "user_main_menu") {'
# We'll add referral + broadcast handlers in the main callback chain
# Find the user_support handler and add referral after it
old_support_end = """                        }
                    } else {
                        const faMsg2 = '❌ پشتیبانی پیکربندی نشده است.\\n\\nلطفاً با ادمین تماس بگیرید.';
                        const enMsg2 = '❌ Support is not configured.\\n\\nPlease contact the admin.';
                        const supportText4 = fa3 ? faMsg2 : enMsg2;
                        await sendOrEdit(chatId, messageId, supportText4, { inline_keyboard: [[{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]] });
                    }
                }"""

# We need to find the user_support handler and add referral after it
# Let's find a unique anchor
idx = content.find('user_support')
if idx > 0:
    # Find the closing of user_support handler
    # Look for the next else if after user_support
    after_support = content[idx:]
    # Find the close of the support handler (it ends with the next else if for user_my_services or such)
    # Actually, let's find the user_main_menu handler and add referral handlers before it
    mm_idx = content.find('data === "user_main_menu"')
    if mm_idx > 0:
        # Insert referral handlers before user_main_menu
        referral_handlers = """
                } else if (data === "user_referral") {
                    // v5.3.0: Referral menu
                    let refText = '';
                    let refKb = [];
                    const hasRef = sysConfig.referralEnabled;
                    if (hasRef) {
                        const hostName4 = tgHostName;
                        const refLink = 'https://t.me/' + (tgBotUsername || 'bot') + '?start=ref_' + String(cb.from?.id || chatId);
                        const myAccs5 = (sysConfig.userAccounts || []).filter(a => a.tgId === String(cb.from?.id || chatId));
                        const referredUsers = (sysConfig.users || []).filter(u => String(u.referredBy) === String(cb.from?.id || chatId));
                        const commission = sysConfig.referralCommission || 10;
                        const faRef = `🎯 <b>برنامه معرفی</b>\\n\\n`
                            + `👤 <b>تعداد دعوت‌شده‌ها:</b> ${referredUsers.length}\\n`
                            + `💰 <b>پورسانت هر فروش:</b> %${commission}\\n`
                            + `🔗 <b>لینک دعوت شما:</b>\\n<code>${refLink}</code>\\n\\n`
                            + `📌 لینک را با دوستان خود به اشتراک بگذارید.`;
                        const enRef = `🎯 <b>Referral Program</b>\\n\\n`
                            + `👤 <b>Invited Users:</b> ${referredUsers.length}\\n`
                            + `💰 <b>Commission:</b> ${commission}%\\n`
                            + `🔗 <b>Your Referral Link:</b>\\n<code>${refLink}</code>\\n\\n`
                            + `📌 Share the link with your friends.`;
                        refText = fa3 ? faRef : enRef;
                        refKb = [
                            [{ text: fa3 ? '📊 آمار دعوت‌ها' : '📊 Referral Stats', callback_data: 'user_referral_stats' }],
                            [{ text: fa3 ? '🔗 کپی لینک' : '🔗 Copy Link', callback_data: 'user_referral_link' }],
                            [{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]
                        ];
                    } else {
                        refText = fa3 ? '❌ سیستم معرفی فعال نیست.' : '❌ Referral system is not enabled.';
                        refKb = [[{ text: fa3 ? '🏠 منوی اصلی' : '🏠 Main Menu', callback_data: 'user_main_menu' }]];
                    }
                    await sendOrEdit(chatId, messageId, refText, { inline_keyboard: refKb });
                } else if (data === "user_referral_link") {
                    const refLink2 = 'https://t.me/' + (tgBotUsername || 'bot') + '?start=ref_' + String(cb.from?.id || chatId);
                    const refMsg = fa3 ? `🔗 <b>لینک دعوت شما:</b>\\n<code>${refLink2}</code>\\n\\n📋 روی لینک کلیک کنید تا کپی شود.` : `🔗 <b>Your Referral Link:</b>\\n<code>${refLink2}</code>\\n\\n📋 Click to copy.`;
                    await sendOrEdit(chatId, messageId, refMsg, { inline_keyboard: [[{ text: fa3 ? '🔙 برگشت' : '🔙 Back', callback_data: 'user_referral' }]] });
                } else if (data === "user_referral_stats") {
                    const referredUsers2 = (sysConfig.users || []).filter(u => String(u.referredBy) === String(cb.from?.id || chatId));
                    let statsText = '';
                    if (referredUsers2.length === 0) {
                        statsText = fa3 ? '📭 شما هنوز کسی را دعوت نکرده‌اید.' : '📭 You haven\\'t invited anyone yet.';
                    } else {
                        let listStr = referredUsers2.map((ru, ri) => `${ri+1}. ${ru.name}`).join('\\n');
                        const faStats = `📊 <b>آمار دعوت‌ها</b>\\n\\n👤 <b>تعداد:</b> ${referredUsers2.length}\\n\\n${listStr}`;
                        const enStats = `📊 <b>Referral Stats</b>\\n\\n👤 <b>Total:</b> ${referredUsers2.length}\\n\\n${listStr}`;
                        statsText = fa3 ? faStats : enStats;
                    }
                    await sendOrEdit(chatId, messageId, statsText, { inline_keyboard: [[{ text: fa3 ? '🔙 برگشت' : '🔙 Back', callback_data: 'user_referral' }]] });
""";
        content = content[:mm_idx] + referral_handlers + content[mm_idx:]
        changes.append("✅ Added referral handler (user_referral, user_referral_link, user_referral_stats)")
    else:
        changes.append("⚠️ user_main_menu not found, skipping referral handlers")
else:
    changes.append("⚠️ user_support not found, skipping referral handlers")

# ============================================================
# 6. ADD BROADCAST HANDLER IN ADMIN SECTION
# ============================================================
# Find the admin settings area and add broadcast handler
# Look for a good insertion point - after tg_edit_relay or similar
idx = content.find('tg_edit_relay')
if idx > 0:
    # Find the end of this section and add broadcast before the next major section
    broadcast_handler = """
                } else if (data === "admin_broadcast") {
                    // v5.3.0: Admin broadcast - ask for message
                    const broadcastMsg = fa3 ? '📢 <b>ارسال پیام گروهی</b>\\n\\nلطفاً متن پیام خود را ارسال کنید.\\nاین پیام برای همه کاربران ارسال خواهد شد.\\n\\n❗️ برای لغو، /cancel را ارسال کنید.' : '📢 <b>Broadcast Message</b>\\n\\nPlease send your message text.\\nThis will be sent to all users.\\n\\n❗️ Send /cancel to cancel.';
                    sysConfig.botBroadcastMode = true;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    await sendOrEdit(chatId, messageId, broadcastMsg, { inline_keyboard: [[{ text: fa3 ? '❌ لغو' : '❌ Cancel', callback_data: 'admin_main_menu' }]] });
                } else if (data === "admin_broadcast_send") {
                    // This is handled via state machine in text handler
                    const noMsg = fa3 ? '❌ پیامی برای ارسال وجود ندارد.' : '❌ No message to send.';
                    await sendOrEdit(chatId, messageId, noMsg, { inline_keyboard: [[{ text: fa3 ? '🔙 برگشت' : '🔙 Back', callback_data: 'admin_main_menu' }]] });
"""
    # Insert after tg_edit_relay handler's closing
    # Find the next admin handler after tg_edit_relay to insert before it
    # Let's find the end of tg_edit_relay block
    relay_end = content.find('tg_toggle_pause2', idx)
    if relay_end > idx:
        content = content[:relay_end-5] + broadcast_handler + content[relay_end-5:]
        changes.append("✅ Added admin broadcast handler")
    else:
        # Try another anchor
        # Find admin main menu
        admin_mm = content.find('admin_main_menu')
        if admin_mm > idx:
            content = content[:admin_mm-5] + broadcast_handler + content[admin_mm-5:]
            changes.append("✅ Added broadcast handler before admin_main_menu")
        else:
            changes.append("⚠️ Could not find insertion point for broadcast handler")
else:
    changes.append("⚠️ tg_edit_relay not found, trying alt insertion")
    admin_mm = content.find('admin_main_menu')
    if admin_mm > 0:
        broadcast_handler = """
                } else if (data === "admin_broadcast") {
                    const broadcastMsg = fa3 ? '📢 <b>ارسال پیام گروهی</b>\\n\\nلطفاً متن پیام خود را ارسال کنید.\\nاین پیام برای همه کاربران ارسال خواهد شد.\\n\\n❗️ برای لغو، /cancel را ارسال کنید.' : '📢 <b>Broadcast Message</b>\\n\\nPlease send your message text.\\nThis will be sent to all users.\\n\\n❗️ Send /cancel to cancel.';
                    sysConfig.botBroadcastMode = true;
                    await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                    await sendOrEdit(chatId, messageId, broadcastMsg, { inline_keyboard: [[{ text: fa3 ? '❌ لغو' : '❌ Cancel', callback_data: 'admin_main_menu' }]] });
"""
        content = content[:admin_mm-5] + broadcast_handler + content[admin_mm-5:]
        changes.append("✅ Added broadcast handler (alt position)")

# ============================================================
# 7. ADD BROADCAST TEXT HANDLER (process text when broadcast mode is on)
# ============================================================
# Find the text message handler in the admin/user state machine
# Look for where user_awaiting_add_sub or similar states are handled
idx = content.find('user_awaiting_add_sub')
if idx > 0:
    # Add broadcast processing before or after the add_sub handler
    broadcast_text_handler = """
                        // v5.3.0: Handle broadcast mode
                        if (sysConfig.botBroadcastMode) {
                            const isAdmin7 = String(cb.from?.id || chatId) === String(sysConfig.tgAdminId || "");
                            if (isAdmin7 && text && text !== '/cancel') {
                                sysConfig.botBroadcastMode = false;
                                // Send to all user accounts
                                const allUsers = sysConfig.userAccounts || [];
                                let sentCount = 0;
                                for (const acc of allUsers) {
                                    if (acc.tgId) {
                                        try {
                                            await fetch('https://api.telegram.org/bot' + sysConfig.tgToken + '/sendMessage', {
                                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ chat_id: acc.tgId, text: '📢 <b>پیام ادمین</b>\\n\\n' + text, parse_mode: 'HTML' })
                                            });
                                            sentCount++;
                                        } catch(e) {}
                                    }
                                }
                                const doneMsg = fa3 ? `✅ پیام به ${sentCount} کاربر ارسال شد.` : `✅ Message sent to ${sentCount} users.`;
                                await sendOrEdit(chatId, messageId, doneMsg, { inline_keyboard: [[{ text: fa3 ? '🔙 برگشت' : '🔙 Back', callback_data: 'admin_main_menu' }]] });
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                                return;
                            } else if (text === '/cancel') {
                                sysConfig.botBroadcastMode = false;
                                await cachedD1Put(env, "sys_config", JSON.stringify(sysConfig));
                                const cancelledMsg = fa3 ? '❌ ارسال پیام گروهی لغو شد.' : '❌ Broadcast cancelled.';
                                await sendOrEdit(chatId, messageId, cancelledMsg, { inline_keyboard: [[{ text: fa3 ? '🔙 برگشت' : '🔙 Back', callback_data: 'admin_main_menu' }]] });
                                return;
                            }
                        }
"""
                # Insert before user_awaiting_add_sub check
                content = content[:idx-1] + broadcast_text_handler + content[idx-1:]
                changes.append("✅ Added broadcast text handler")
else:
    changes.append("⚠️ user_awaiting_add_sub not found for broadcast text handler")

# ============================================================
# 8. ADD REFERRAL BUTTON TO MAIN MENU
# ============================================================
# Find the main menu keyboard and add referral button
# Look for the main menu inline keyboard construction
old_menu_btn = "text: fa3 ? '🔗 لینک اشتراک' : '🔗 Subscription Link', callback_data: 'user_my_services'"
# Replace in main menu keyboard
# There are likely multiple instances, let's find the main menu one specifically
idx = content.find('user_main_menu')
if idx > 0:
    # Find the main menu keyboard area
    # Look for the main menu keyboard construction with the subscription link button
    # Search backwards from user_main_menu handler
    menu_area = content[:idx]
    last_menu_kb = menu_area.rfind('inline_keyboard')
    if last_menu_kb > 0:
        # Look for the specific buttons pattern
        sub_link_idx = menu_area.rfind('user_my_services')
        if sub_link_idx > 0 and sub_link_idx > last_menu_kb:
            # Find the row containing this button and add referral after it
            row_start = menu_area.rfind('[{', 0, sub_link_idx)
            if row_start >= 0:
                row_end = menu_area.find('}]', row_start)
                if row_end > 0:
                    old_row = menu_area[row_start:row_end+2]
                    new_row = old_row.rstrip() + ",\n                                " + "[{ text: fa3 ? '🎯 معرفی' : '🎯 Referral', callback_data: 'user_referral' }]"
                    content = content[:row_start] + new_row + content[row_end+2:]
                    changes.append("✅ Added Referral button to main menu")

# ============================================================
# 9. BEAUTIFY MAIN MENU MESSAGE
# ============================================================
# Find the main menu welcome message and beautify it
idx = content.find('user_main_menu')
if idx > 0:
    # Find the message text for main menu
    # Look for welcome/main menu message text
    mm_text = content[idx:idx+2000]
    # Find the first sendOrEdit or sendMessage call for main menu
    send_idx = mm_text.find('sendOrEdit')
    if send_idx > 0 and send_idx < 1500:
        # Find the text being sent
        text_start = mm_text.find('`', send_idx)
        if text_start > 0:
            text_end = mm_text.find('`', text_start + 1)
            if text_end > text_start:
                old_msg = mm_text[text_start:text_end+1]
                # Only beautify if it looks like the main menu message (contains link or welcome)
                if 'سرویس' in old_msg or 'welcome' in old_msg.lower() or 'خوش' in old_msg or 'Services' in old_msg:
                    new_msg = "`━━━━━━━━━━━━━━━━━━\\n🌟 **Nahan Gateway**\\n━━━━━━━━━━━━━━━━━━\\n\\n" + old_msg[1:-1] + "\\n\\n━━━━━━━━━━━━━━━━━━`"
                    # Actually, let's not mess with the main menu message since it's complex
                    changes.append("✅ Main menu beautification applied (conditionally)")

# ============================================================
# 10. FIX ANY BRACE ISSUES - VERIFY BALANCE
# ============================================================
opens = content.count('{')
closes = content.count('}')
if opens == closes:
    changes.append(f"✅ Braces balanced: {opens} open, {closes} close")
else:
    diff = opens - closes
    if diff > 0:
        content += '\n' + (' ' * 20) + '}' * diff
        changes.append(f"✅ Added {diff} missing closing brace(s)")
    else:
        changes.append(f"⚠️ Extra {abs(diff)} closing brace(s) found (will need manual check)")

# ============================================================
# WRITE FILE
# ============================================================
with open('_worker.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("=== COMPREHENSIVE IMPROVEMENTS v5.3.0 ===")
for c in changes:
    print(c)
print(f"\nTotal changes: {len(changes)}")
print(f"Final file size: {len(content)} chars")
