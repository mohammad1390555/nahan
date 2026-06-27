#!/usr/bin/env python3
"""Fix web panel sub links + add owner/sub-user management"""

import re

with open('_worker.js', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# ===== 1. Fix profile sync URL to use subHash instead of ?sub=name =====
old_profile_sync = '''                let subSuffix = p.name === 'Default' ? '' : '?sub=' + encodeURIComponent(p.name);
                let subHashField = p.subHash || generateSubHash(p.id);
                return { name: p.name, id: p.id, sync: `${protocol}://${baseHost}/${sysConfig.apiRoute}${subSuffix}` };'''

new_profile_sync = '''                let subHashField = p.subHash || generateSubHash(p.id);
                return { name: p.name, id: p.id, subHash: subHashField, sync: `${protocol}://${baseHost}/${encodeURI(sysConfig.subRoute || "sub")}/${subHashField}` };'''

if old_profile_sync in content:
    content = content.replace(old_profile_sync, new_profile_sync, 1)
    changes += 1
    print('OK: Updated profile sync URL to use subHash')
else:
    print('FAIL: Profile sync pattern not found')

# ===== 2. Add sub info page link button to web panel user rows =====
# Find the button group in user row HTML and add a "Sub Info" button
old_user_buttons = '''                            <div class="flex items-center gap-1.5 flex-wrap">\
                                <button onclick="copyData('sync-${u.id}')" title="${lang==='fa'?'کپی لینک اشتراک':'Copy Sub Link'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-all duration-150">🔗</button>\\\
                                <button onclick="togglePauseUser('${u.id}')" title="${lang==='fa'?(u.isPaused?'فعال کردن':'مکث'):(u.isPaused?'Resume':'Pause')}" class="px-2 py-1 rounded-lg text-xs font-medium ${u.isPaused ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'} transition-all duration-150">${u.isPaused ? '▶️' : '⏸️'}</button>\\\
                                <button onclick="editUser('${u.id}')" title="${lang==='fa'?'ویرایش':'Edit'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all duration-150">✏️</button>\\\
                                <button onclick="resetUserTraffic('${u.id}')" title="${lang==='fa'?'بازنشانی ترافیک':'Reset Traffic'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all duration-150">🔄</button>\\\
                                <button onclick="deleteUser('${u.id}')" title="${lang==='fa'?'حذف':'Delete'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all duration-150">🗑️</button>\
                            </div>'''

new_user_buttons = '''                            <div class="flex items-center gap-1.5 flex-wrap">\
                                <button onclick="copyData('sync-${u.id}')" title="${lang==='fa'?'کپی لینک اشتراک':'Copy Sub Link'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-all duration-150">🔗</button>\\\
                                <button onclick="copyData('subinfo-${u.id}')" title="${lang==='fa'?'لینک صفحه اشتراک':'Sub Info Page'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all duration-150">📊</button>\\\
                                <button onclick="togglePauseUser('${u.id}')" title="${lang==='fa'?(u.isPaused?'فعال کردن':'مکث'):(u.isPaused?'Resume':'Pause')}" class="px-2 py-1 rounded-lg text-xs font-medium ${u.isPaused ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'} transition-all duration-150">${u.isPaused ? '▶️' : '⏸️'}</button>\\\
                                <button onclick="editUser('${u.id}')" title="${lang==='fa'?'ویرایش':'Edit'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all duration-150">✏️</button>\\\
                                <button onclick="resetUserTraffic('${u.id}')" title="${lang==='fa'?'بازنشانی ترافیک':'Reset Traffic'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all duration-150">🔄</button>\\\
                                <button onclick="deleteUser('${u.id}')" title="${lang==='fa'?'حذف':'Delete'}" class="px-2 py-1 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all duration-150">🗑️</button>\
                            </div>'''

if old_user_buttons in content:
    content = content.replace(old_user_buttons, new_user_buttons, 1)
    changes += 1
    print('OK: Added Sub Info Page button to user rows')
else:
    print('FAIL: User buttons pattern not found')

# ===== 3. Add sub info hidden input next to sync input in user rows =====
old_hidden_input = '''<input type="hidden" id="sync-\\${u.id}" value="\\${rawSync}">'''

new_hidden_inputs = '''<input type="hidden" id="sync-\\${u.id}" value="\\${rawSync}">\
<input type="hidden" id="subinfo-\\${u.id}" value="\\${window.location.origin}/\\${encodeURI(window.nahanConfig?.subRoute || 'sub')}/\\${u.subHash || ''}">'''

# Use raw string for the template literal - this is tricky
# Let's use the actual string content
old_hidden = '''<input type="hidden" id="sync-${u.id}" value="${rawSync}">'''
new_hidden = '''<input type="hidden" id="sync-${u.id}" value="${rawSync}"><input type="hidden" id="subinfo-${u.id}" value="${window.location.origin}/${encodeURI(window.nahanConfig?.subRoute || 'sub')}/${u.subHash || ''}">'''

if old_hidden in content:
    content = content.replace(old_hidden, new_hidden, 1)
    changes += 1
    print('OK: Added subinfo hidden input')
else:
    print('FAIL: Hidden input pattern not found')

# ===== 4. Add ownerId field to user objects in admin_approve_purchase and trial =====
# Add ownerTgId to newUser in purchase approval
old_newuser_purchase = '''const newUser = { id: newUserId, name: userName, uuid: newUuid, isPaused: false, limitTotalReq: totalBytes, expiryMs: expiryDate, subHash: generateSubHash(newUserId) };'''

new_newuser_purchase = '''const newUser = { id: newUserId, name: userName, uuid: newUuid, isPaused: false, limitTotalReq: totalBytes, expiryMs: expiryDate, subHash: generateSubHash(newUserId), ownerTgId: String(cb.from?.id || chatId) };'''

if old_newuser_purchase in content:
    content = content.replace(old_newuser_purchase, new_newuser_purchase, 1)
    changes += 1
    print('OK: Added ownerTgId to purchase newUser')
else:
    print('FAIL: Purchase newUser pattern not found')

# Also update the trial user creation
old_trial_user = '''const trialUser = { id: trialId, name: trialName, uuid: trialUuid, isPaused: false, limitTotalReq: trialBytes, expiryMs: trialExpiry, subHash: generateSubHash(trialId) };'''

new_trial_user = '''const trialUser = { id: trialId, name: trialName, uuid: trialUuid, isPaused: false, limitTotalReq: trialBytes, expiryMs: trialExpiry, subHash: generateSubHash(trialId), ownerTgId: String(cb.from?.id || chatId) };'''

if old_trial_user in content:
    content = content.replace(old_trial_user, new_trial_user, 1)
    changes += 1
    print('OK: Added ownerTgId to trial user')
else:
    print('FAIL: Trial user pattern not found')

# ===== 5. Add owner column to web panel user rows =====
# Add owner name display next to user name in the user row header
old_user_name_display = '''<span class="text-xs font-bold text-slate-800 dark:text-slate-200">${u.name}</span>'''

new_user_name_display = '''<span class="text-xs font-bold text-slate-800 dark:text-slate-200">${u.name}</span>\
${u.ownerTgId ? `<span class="text-[9px] ml-1 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">👤 Owner</span>` : ''}'''

if old_user_name_display in content:
    content = content.replace(old_user_name_display, new_user_name_display, 1)
    changes += 1
    print('OK: Added owner badge to user name display')
else:
    print('FAIL: User name display pattern not found')

# ===== 6. Add user_manage_owners callback in bot =====
# Find the user_my_services section and add owner management options
# Look for the service detail text that shows subLink2
old_svc_detail_owner = '''const subLink2 = `${new URL(request.url).origin}/${encodeURI(sysConfig.subRoute || "sub")}/${u.subHash || generateSubHash(u.id)}`;
                            const svcDetailText = fa3
                                ? `📋 <b>جزئیات سرویس</b>\\n━━━━━━━━━━━━━━━\\n👤 <b>نام:</b> ${esc(u.name)}\\n🆔 <b>UUID:</b> <code>${u.uuid}</code>\\n📊 <b>مصرف:</b> ${usedGB}/${totalGB} GB\\n📈 <b>درصد:</b> ${usagePercent}%\\n📆 <b>روزهای باقی‌مانده:</b> ${remainingDays}\\n⏰ <b>انقضا:</b> ${expiryDateStr}\\n🔗 <b>لینک اشتراک:</b> \`${subLink2}\``
                                : `📋 <b>Service Details</b>\\n━━━━━━━━━━━━━━━\\n👤 <b>Name:</b> ${esc(u.name)}\\n🆔 <b>UUID:</b> <code>${u.uuid}</code>\\n📊 <b>Usage:</b> ${usedGB}/${totalGB} GB\\n📈 <b>Percent:</b> ${usagePercent}%\\n📆 <b>Days Left:</b> ${remainingDays}\\n⏰ <b>Expiry:</b> ${expiryDateStr}\\n🔗 <b>Sub Link:</b> \`${subLink2}\``;'''

new_svc_detail_owner = '''const subLink2 = `${new URL(request.url).origin}/${encodeURI(sysConfig.subRoute || "sub")}/${u.subHash || generateSubHash(u.id)}`;
                            const ownerText = u.ownerTgId ? (fa3 ? `\\n👤 <b>صاحب:</b> <code>${u.ownerTgId}</code>` : `\\n👤 <b>Owner:</b> <code>${u.ownerTgId}</code>`) : '';
                            const svcDetailText = fa3
                                ? `📋 <b>جزئیات سرویس</b>\\n━━━━━━━━━━━━━━━\\n👤 <b>نام:</b> ${esc(u.name)}\\n🆔 <b>UUID:</b> <code>${u.uuid}</code>\\n📊 <b>مصرف:</b> ${usedGB}/${totalGB} GB\\n📈 <b>درصد:</b> ${usagePercent}%\\n📆 <b>روزهای باقی‌مانده:</b> ${remainingDays}\\n⏰ <b>انقضا:</b> ${expiryDateStr}\\n🔗 <b>لینک اشتراک:</b> \`${subLink2}\`${ownerText}`
                                : `📋 <b>Service Details</b>\\n━━━━━━━━━━━━━━━\\n👤 <b>Name:</b> ${esc(u.name)}\\n🆔 <b>UUID:</b> <code>${u.uuid}</code>\\n📊 <b>Usage:</b> ${usedGB}/${totalGB} GB\\n📈 <b>Percent:</b> ${usagePercent}%\\n📆 <b>Days Left:</b> ${remainingDays}\\n⏰ <b>Expiry:</b> ${expiryDateStr}\\n🔗 <b>Sub Link:</b> \`${subLink2}\`${ownerText}`;'''

if old_svc_detail_owner in content:
    content = content.replace(old_svc_detail_owner, new_svc_detail_owner, 1)
    changes += 1
    print('OK: Added owner info to service details')
else:
    print('FAIL: Service detail pattern not found')

with open('_worker.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nTotal changes applied: {changes}')
