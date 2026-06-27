#!/usr/bin/env python3
"""Fix brace structure causing 'Unexpected else' at line 4102"""

with open('_worker.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The problem area starts around line 4050-4110
# Let me trace the structure and find/replace the problematic section

changes = 0

# Strategy: Find the admin_approve_purchase section and fix braces
# The issue is that the 20-service limit check was inserted incorrectly
# Let me find the exact structure and fix it

# Find the admin_approve_purchase handler
for i, line in enumerate(lines):
    if 'admin_approve_purchase:' in line and 'data.startsWith' in line:
        print(f'admin_approve_purchase at line {i+1}')
        
        # Find the closing brace of this handler (before admin_reject_purchase)
        for j in range(i, min(i + 120, len(lines))):
            if 'admin_reject_purchase:' in lines[j] and 'data.startsWith' in lines[j]:
                reject_line = j
                print(f'admin_reject_purchase at line {j+1}')
                
                # Now count braces between line i and reject_line to find imbalance
                depth = 0
                for k in range(i, reject_line + 1):
                    opens = lines[k].count('{')
                    closes = lines[k].count('}')
                    depth += opens - closes
                
                print(f'Brace depth at reject handler start: {depth}')
                print(f'(should be 0 to be balanced)')
                
                if depth < 0:
                    # Too many closing braces - remove the excess
                    # Find where the extra close happens
                    depth = 0
                    for k in range(i, reject_line + 1):
                        old_depth = depth
                        opens = lines[k].count('{')
                        closes = lines[k].count('}')
                        depth += opens - closes
                        if depth < 0 and old_depth >= 0:
                            print(f'Depth went negative at line {k+1}')
                            # Find what line has the extra }
                            line_stripped = lines[k].strip()
                            if line_stripped == '}':
                                print(f'Removing extra } at line {k+1}')
                                del lines[k]
                                changes += 1
                                depth = 0  # reset
                                # Re-scan
                                break
                
                break
        break

# Also check admin_trial_users admin_delete_trial_user section in admin callback chain
# These were added in the same patch and might also have issues
for i, line in enumerate(lines):
    if 'admin_trial_users' in line and 'data ===' in line and i > 4000:
        print(f'admin_trial_users handler at line {i+1}')
        break

if changes == 0:
    print('No direct fix applied, trying alternative approach...')
    # The 'Unexpected else' at line 4102 means the } before else if is closing too many blocks
    # Let me just check the specific structure around line 4099-4103
    for i in range(4098, min(4105, len(lines))):
        print(f'Line {i+1}: {lines[i].rstrip()}')

with open('_worker.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f'Changes applied: {changes}')
