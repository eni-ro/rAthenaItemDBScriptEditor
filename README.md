# rAthena ItemDB Script Editor
This editor is a scripting support tool.  

## Useage
1. Run `itemdb-script-editor.exe`
2. Configure your ItemDB/MobDB file paths in the **Settings** (gear icon)
   - These settings are stored in `db.yml`.
3. Load item script by selecting `Load` button at the top-right
4. Edit script
5. Select `Save` button to overwrite your ItemDB file

### Item Search by Custom Names (ItemName)
The `ItemName` setting allows you to specify a YAML file to include custom display names (e.g., Japanese names) in the search index. This is a custom format unique to this editor and is not an official rAthena file.

**Format (`sample.yml`):**
```yaml
Body:
  - Id: 501
    Name: Alternative name of Red Potion
  - Id: 502
    Name: Alternative name of Orange Potion
```

## History
* v0.11
  * Added Copy and Delete context menu for search results
  * Improved Script Editor UI with Confirm/Cancel buttons and keyboard shortcut (Ctrl+Enter)
  * Validation to prevent duplicate Item IDs and AegisNames
  * Fixed various bugs (Unsaved changes persistence, Slot '0' persistence, etc.)

* v0.10
  * Support for editing various item fields (ID, Type, Trade settings, etc.) in addition to scripts
  * Added support for viewing and editing Item Combos
  * Multi-encoding support (UTF-8, Shift-JIS, etc.) for YAML files
  * Improved file safety with automatic backup handling (.bak)
  * Added script "Inject" button for quick script modification
  * Major UI modernization and search performance improvements

* v0.9
  * Rewrite with Tauri
  * Add some scripts

* v0.8
  * Change Mob DB format to YAML
  * Add some scripts

* v0.7
  * Fix file corruption when injecting
  * Add some scripts

* v0.6
  * Fix GDK error asserted when selecting a parameter

* v0.5
  * Fix corrupting yaml file when injecting script is blank
  * Add Equip/Unequip script load and inject feature(experimental)
  * Add some scripts
  * Improve to be able to select multiple parameter from dialog(for criteria)

* v0.4
  * Improve insertion function to break lines with indentation
  * Add script load and inject feature(experimental)

* v0.3
  * Add auto complete function
  * Add scripts to access char info and count item  
  **I'm not sure if eAJ script is correct,because I don't fully understand it.**
  
* v0.2
  * Improve UI to scale when window resizing
  * Fix some categories and scripts name

* v0.1
  * first release

## Security Note (Windows SmartScreen)
The provided `.exe` file is built using PyInstaller and Tauri. Because it is not digitally signed, Windows SmartScreen may show a "Windows protected your PC" warning when you run it for the first time.
- To run anyway: Click "More info" -> "Run anyway".
- If you are concerned about security, you can build the executable from the source code yourself (see below).

## How to Build from Source
If you want to build the editor yourself, follow these steps:

### Prerequisites
- [Node.js](https://nodejs.org/) (latest LTS)
- [Rust](https://www.rust-lang.org/) (via rustup)
- [Python 3.10+](https://www.python.org/)
- [uv](https://github.com/astral-sh/uv) (for python package management)

### Build Steps
1. **Clone the repository**
2. **Build the Python backend (Sidecar)**
   ```powershell
   cd scripts
   .\build_processor.ps1
   cd ..
   ```
3. **Build the Tauri application**
   ```bash
   npm install
   npm run tauri build
   ```
   The executable will be located in `src-tauri/target/release/`.

## Credits
[rAthena](https://rathena.org/) : this editor uses docs/db files
