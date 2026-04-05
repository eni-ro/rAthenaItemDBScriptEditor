# rAthena ItemDB Script Editor
This editor is a scripting support tool.  

## Useage
1. Open `db.yml`,and add your original ItemDB/MobDB file path
2. Run `itemdb-script-editor.exe`
3. Load item script by selecting `Load` button at the right-top of window
4. Edit script
5. Select `Save` button to overwrite your ItemDB file

## History
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

## Credits
[rAthena](https://rathena.org/) : this editor uses docs/db files
