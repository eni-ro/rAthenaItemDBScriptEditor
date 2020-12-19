# rAthena ItemDB Script Editor
This editor is a scripting support tool.  
<img src="https://user-images.githubusercontent.com/59181965/102481969-db6bf900-40a5-11eb-982a-db88d4ec9ce9.png" width=50%>
<img src="https://user-images.githubusercontent.com/59181965/100858163-f8fb6900-34d0-11eb-9519-7ff1031cab18.png" width=25%>

## Requirement
* Ruby  
You can find some links to download binary installer for Windows at the top of the [Official HP](https://www.ruby-lang.org/en/downloads/)  
I use [RubyInstaller](https://rubyinstaller.org/)  
* Ruby Gems  
After Ruby installation finished,open command prompt and type commands below  
  * Gtk3  
    `gem install gtk3`  
  * GtkSourceView3  
    `gem install gtksourceview3`  
  * win32-clipboard  
    `gem install win32-clipboard`  

## Useage
1. Open `db.yml`,and add your original ItemDB/MobDB file path
2. Run `editor.rb`
3. Load item script by selecting `Load` button at the right-top of window
4. Edit script
5. Select `Inject Script` button to overwrite your ItemDB file

## History
* v0.6
  * Fixe GDK error asserted when selecting a parameter

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
