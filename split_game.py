import re
import os

def split_game():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract CSS
    css_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if css_match:
        css_content = css_match.group(1).strip()
        os.makedirs('css', exist_ok=True)
        with open('css/style.css', 'w', encoding='utf-8') as f:
            f.write(css_content)
        print("✓ Created css/style.css")

    # Extract JS
    js_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
    if js_match:
        js_content = js_match.group(1).strip()
        os.makedirs('js', exist_ok=True)
        
        # We will split JS into game.js (logic) and ui.js (rendering)
        # To keep it simple and safe first, let's put all JS into js/game.js
        # and reference it. This guarantees we don't break dependencies.
        with open('js/game.js', 'w', encoding='utf-8') as f:
            f.write(js_content)
        print("✓ Created js/game.js")

    # Create clean index.html
    # Remove style block and script block, insert links
    new_html = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="css/style.css">', content, flags=re.DOTALL)
    new_html = re.sub(r'<script>.*?</script>', '<script src="js/game.js"></script>', new_html, flags=re.DOTALL)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("✓ Updated index.html")

if __name__ == '__main__':
    split_game()
