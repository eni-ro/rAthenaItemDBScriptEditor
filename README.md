# rAthena ItemDB Script Editor
This editor is a scripting support tool.  
This editor DONOT insert scripts to YAML file automatically,so please paste manually.  
<img src="https://user-images.githubusercontent.com/59181965/100858159-f6990f00-34d0-11eb-9a14-8deb720488e0.png" width=50%>
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
1. Open 'db.yml',and add your original ItemDB/MobDB file path
2. Run 'editor.rb'
3. After editing script,push `Copy Script` button
4. Open your ItemDB
5. Paste script

## Known Issue
* When you select an item from parameter list, the following error message will be displayed.
I release this editor as it is,because I couldn't resolve this error and it works.
`Gdk-CRITICAL **: gdk_device_get_source: assertion 'GDK_IS_DEVICE (device)' failed`

## History
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
