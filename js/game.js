// ====================================================================
// NGHỊCH HỎA TINH ĐỒ — Game Bootstrap
// Loads all modules in dependency order
// ====================================================================
//
// Module loading order matters:
// 1. constants  - Data definitions (realms, items, skills, areas)
// 2. state      - Game state, save/load, EXP helpers
// 3. cultivate  - Cultivate, idle, addExp
// 4. tribulation - Small/Great tribulation
// 5. combat     - Hunting monsters + Boss fights
// 6. skills     - Active/passive skills
// 7. alchemy    - Herbs, pills, inventory
// 8. shop       - Shop rendering + buying
// 9. pet        - Pet, cave, rebirth
// 10. ui        - UI updates, announcements, tabs, init
//
// Each module is loaded via <script> tags in index.html
// All functions are global (no module system needed for vanilla JS)
