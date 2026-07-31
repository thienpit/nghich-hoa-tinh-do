import re, os

def clean_split():
    """Clean split of the original monolith index.html into modules."""
    
    # Read original backup (has inline script)
    with open('index.html.bak', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract JS from <script> tag
    js_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
    if not js_match:
        print("ERROR: No <script> tag found")
        return
    js = js_match.group(1).strip()
    
    # Remove dynamic CSS injection at the end (the pulse/floatUp keyframes)
    # These go into style.css instead
    dyn_css = re.search(r"// Add dynamic CSS.*?document\.head\.appendChild\(ss\);\n\}\)\(\);", js, re.DOTALL)
    if dyn_css:
        # Extract the keyframe CSS and add it to style.css
        dyn_css_text = dyn_css.group(0)
        js = js[:dyn_css.start()].rstrip()
    
    # Split by top-level section markers
    # Find all "// ===== SECTION_NAME =====" comments
    section_pattern = re.compile(r'^// =====\s*(.+?)\s*=====$', re.MULTILINE)
    matches = list(section_pattern.finditer(js))
    
    print(f"Found {len(matches)} section markers")
    
    # Build sections list with content
    sections = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i+1].start() if i+1 < len(matches) else len(js)
        name = m.group(1).strip()
        # Remove "(Fixed: ...)" suffixes for cleaner names
        name = re.sub(r'\s*\(.*$', '', name)
        sections.append({
            'name': name,
            'content': js[start:end].rstrip()
        })
    
    # Show sections
    for s in sections:
        print(f"  [{s['name']}] ({len(s['content'].splitlines())} lines)")
    
    # Group into modules
    modules = {
        'constants': [],
        'state': [],
        'cultivate': [],
        'tribulation': [],
        'combat': [],
        'skills': [],
        'alchemy': [],
        'shop': [],
        'pet': [],
        'ui': [],
    }
    
    # Track occurrences for sections that appear twice
    skill_occurrence = 0
    adventure_occurrence = 0
    
    for s in sections:
        name = s['name']
        
        if name == 'CONSTANTS':
            modules['constants'].append(s['content'])
        elif name == 'ADVENTURE AREAS':
            adventure_occurrence += 1
            if adventure_occurrence == 1:
                # First occurrence = data definition
                modules['constants'].append(s['content'])
            else:
                # Second occurrence = render functions
                modules['combat'].append(s['content'])
        elif name == 'SKILLS':
            skill_occurrence += 1
            if skill_occurrence == 1:
                modules['constants'].append(s['content'])
            else:
                modules['skills'].append(s['content'])
        elif name == 'LOOT ITEMS':
            modules['constants'].append(s['content'])
        elif name == 'SHOP ITEMS':
            modules['constants'].append(s['content'])
        elif name == 'GAME STATE':
            modules['state'].append(s['content'])
        elif name == 'SAVE/LOAD':
            modules['state'].append(s['content'])
        elif name == 'EXP HELPERS':
            modules['state'].append(s['content'])
        elif name == 'ADD EXP':
            modules['cultivate'].append(s['content'])
        elif name == 'CULTIVATE':
            modules['cultivate'].append(s['content'])
        elif name == 'AUTO/IDLE':
            modules['cultivate'].append(s['content'])
        elif name == 'TRIBULATION':
            modules['tribulation'].append(s['content'])
        elif name == 'HUNTING':
            modules['combat'].append(s['content'])
        elif name == 'BOSS':
            modules['combat'].append(s['content'])
        elif name == 'HERBS & PILLS':
            modules['alchemy'].append(s['content'])
        elif name == 'SHOP':
            modules['shop'].append(s['content'])
        elif name == 'CAVE':
            modules['pet'].append(s['content'])
        elif name == 'PET':
            modules['pet'].append(s['content'])
        elif name == 'REBIRTH':
            modules['pet'].append(s['content'])
        elif name == 'ANNOUNCEMENTS':
            modules['ui'].append(s['content'])
        elif name == 'UI UPDATE':
            modules['ui'].append(s['content'])
        elif name == 'RENDER HELPERS':
            modules['ui'].append(s['content'])
        elif name == 'TABS':
            modules['ui'].append(s['content'])
        elif name == 'GAME LOOP':
            modules['ui'].append(s['content'])
        elif name == 'DETECT VERCEL':
            modules['ui'].append(s['content'])
        elif name == 'INIT':
            modules['ui'].append(s['content'])
        else:
            print(f"  WARNING: Unknown section '{name}' -> skipping")
    
    # Write modules
    os.makedirs('js/modules', exist_ok=True)
    
    for module_name, content_parts in modules.items():
        if not content_parts:
            print(f"  WARNING: Empty module '{module_name}'")
            continue
        
        module_content = '\n\n'.join(content_parts)
        filepath = f'js/modules/{module_name}.js'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(module_content + '\n')
        
        line_count = len(module_content.splitlines())
        print(f"  ✅ {filepath} ({line_count} lines)")
    
    # Add keyframe animations to CSS
    keyframes_to_add = """
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(232,213,163,0.4)}50%{box-shadow:0 0 0 12px rgba(232,213,163,0)}}
@keyframes floatUp{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-35px)}}"""
    
    with open('css/style.css', 'a', encoding='utf-8') as f:
        f.write(keyframes_to_add)
    print("\n  ✅ Added pulse/floatUp keyframes to css/style.css")
    
    # Delete other.js and cleanup scripts
    for f in ['js/modules/other.js', 'split_game.py', 'split_modular.py', 'fix_modules.py', 'analyze_js.py']:
        if os.path.exists(f):
            os.remove(f)
            print(f"  🗑️ Deleted {f}")

if __name__ == '__main__':
    clean_split()
