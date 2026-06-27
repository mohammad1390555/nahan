#!/usr/bin/env python3
"""Fix remaining issues in _worker.js"""

import re

with open('_worker.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

changes = 0

# Helper: find line index by content
def find_line(pattern, start=0):
    for i in range(start, len(lines)):
        if pattern in lines[i]:
            return i
    return -1

# 1. Add ownerTgId to newUser in purchase approval (multi-line object)
purchase_start = find_line('const newUser = { id: newUserId')
if purchase_start >= 0:
    # Find the end of this object
    purchase_end = purchase_start
    for j in range(purchase_start, min(purchase_start + 15, len(lines))):
        if '};' in lines[j] or '};' in lines[j]:
            purchase_end = j
            break
    obj = ''.join(lines[purchase_start:purchase_end+1])
    if 'ownerTgId' not in obj and 'purchase' in ''.join(lines[max(0,purchase_start-20):purchase_start+5]):
        # Replace subHash line with ownerTgId added
        for j in range(purchase_start, purchase_end+1):
            if 'subHash: generateSubHash(newUserId)' in lines[j]:
                if 'ownerTgId' not in lines[j]:
                    lines[j] = lines[j].replace(
                        'subHash: generateSubHash(newUserId)',
                        'subHash: generateSubHash(newUserId), ownerTgId: String(cb.from?.id || chatId)'
                    )
                    changes += 1
                    print(f'OK 1: Added ownerTgId to purchase newUser (line {j+1})')
                break
        else:
            print('FAIL 1: subHash not found in purchase newUser object')

# 2. Add ownerTgId to trialUser (multi-line object)
trial_start = find_line('const trialUser')
if trial_start >= 0:
    trial_end = trial_start
    for j in range(trial_start, min(trial_start + 15, len(lines))):
        if '};' in lines[j]:
            trial_end = j
            break
    obj = ''.join(lines[trial_start:trial_end+1])
    if 'ownerTgId' not in obj:
        for j in range(trial_start, trial_end+1):
            if 'subHash: generateSubHash(trialId)' in lines[j]:
                if 'ownerTgId' not in lines[j]:
                    lines[j] = lines[j].replace(
                        'subHash: generateSubHash(trialId)',
                        'subHash: generateSubHash(trialId), ownerTgId: String(cb.from?.id || chatId)'
                    )
                    changes += 1
                    print(f'OK 2: Added ownerTgId to trialUser (line {j+1})')
                break

# 3. Add subinfo button in web panel user rows
btn_line = find_line("copyData('sync-${u.id}')")
if btn_line >= 0:
    line = lines[btn_line]
    if 'subinfo-' not in line and '🔗</button>' in line:
        # Find the closing </button> tag
        idx = line.find('🔗</button>')
        if idx > 0:
            end_of_btn = idx + len('🔗</button>')
            before = line[:end_of_btn]
            after = line[end_of_btn:]
            
            new_btn = '<button onclick="copyData(\\'subinfo-${u.id}\\')" title="${lang===\\'\\'fa\\'\\'?\\'\\'صفحه اشتراک\\'\\':\\'\\'Sub Info Page\\'\\'}\\" class="px-2 py-1 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all duration-150">📊</button>'
            
            lines[btn_line] = before + '\\' + new_btn + after
            changes += 1
            print(f'OK 3: Added subinfo button (line {btn_line+1})')

# 4. Add hidden subinfo input
hidden_line = find_line('id="sync-${u.id}" value="${rawSync}"')
if hidden_line >= 0:
    line = lines[hidden_line]
    if 'subinfo-' not in line:
        new_input = '<input type="hidden" id="subinfo-${u.id}" value="${window.location.origin}/${encodeURIComponent(window.nahanConfig?.subRoute || \\'\\'sub\\'\\')}/${u.subHash || \\'\\'\\'}">'
        # Insert after the sync input
        idx = line.find('>')
        if idx > 0:
            lines[hidden_line] = line[:idx+1] + new_input + line[idx+1:]
            changes += 1
            print(f'OK 4: Added subinfo hidden input (line {hidden_line+1})')

# Save
with open('_worker.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f'\nTotal changes: {changes}')
