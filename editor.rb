# -*- encoding: utf-8 -*-
require 'gtk3'
require 'gtksourceview3'
require 'win32/clipboard'
require './table_pick_dialog'
require './rADB'

def on_win_destroy
  Gtk.main_quit
end

def on_entry_script_search_changed
  update_script_tree_view($entry_script_search.text)
end

def update_script_tree_view(filter)
  $script_model.clear
  # Setup Script Menu
  sc = $db.get_filtered_script(filter)

  if filter == ''
    c = ''
    it_root = nil
    sc.each do |x|
      if x[0] != c
        it_root = $script_model.append(nil)
        $script_model.set_value(it_root, 0, '')
        $script_model.set_value(it_root, 1, x[0])
        c = x[0]
      end
      it_sub = $script_model.append(it_root)
      $script_model.set_value(it_sub, 0, x[0])
      $script_model.set_value(it_sub, 1, x[1])
    end
  else
    sc.each do |x|
      it_root = $script_model.append(nil)
      $script_model.set_value(it_root, 0, x[0])
      $script_model.set_value(it_root, 1, x[1])
    end
  end
end

def on_btn_expand_clicked
  $tee_view_script.expand_all
end

def on_btn_collapse_clicked
  $tee_view_script.collapse_all
end

def hide_arg(index)
  set_label_str($label_param_desc[index],'')
  $entry_arg[index].sensitive = false
  $entry_arg[index].opacity = 0
end
def reveal_arg(index,label_str,entry_str,icon)
  set_label_str($label_param_desc[index],label_str)
  if entry_str != nil
    set_entry_str($entry_arg[index],entry_str)
  end
  if icon
    $entry_arg[index].secondary_icon_sensitive = true
    $entry_arg[index].secondary_icon_activatable  = true
  else
    $entry_arg[index].secondary_icon_sensitive = false
    $entry_arg[index].secondary_icon_activatable  = false
  end
  $entry_arg[index].sensitive = true
  $entry_arg[index].opacity = 1
end

def on_tee_view_script_cursor_changed
  sel = $tee_view_script.selection
  if sel.selected
    # hide param input entries
    $max_arg_num.times{|i|
      hide_arg(i)
    }

    parent_str = $script_model.get_value(sel.selected,0)
    disp_str = $script_model.get_value(sel.selected,1)
    arg_set_default = false #entry text shold be erase or not
    if $category_str != parent_str || $script_str != disp_str
      arg_set_default = true
      $category_str = parent_str
      $script_str = disp_str
    end
    if parent_str == ''
      set_label_str($label_script_desc,$db.script_category_desc(disp_str))
    else
      set_label_str($label_script_desc,$db.script_desc(parent_str,disp_str))
      $db.script_arg_num(parent_str,disp_str).times do |i|
        label = $db.script_arg_desc(parent_str,disp_str,i)
        entry = nil
        if arg_set_default == true
          entry = $db.script_arg_default(parent_str,disp_str,i)
        end
        icon = $db.script_arg_input_is_list?(parent_str,disp_str,i)
        reveal_arg(i,label,entry,icon)
      end
    end
  end
end

def set_label_str(widget,str)
  if str != nil
    if str.instance_of?(Array)
      widget.text = str.join("\r\n")
    else
      widget.text = str
    end
  end
end

def set_text_view_str(widget,str)
  if str != nil
    if str.instance_of?(Array)
      widget.buffer.text = str.join("\r\n")
    else
      widget.buffer.text = str
    end
  end
end
def get_text_view_str(widget)
  return widget.buffer.text
end

def add_text_view_str(widget,str)
  if str != nil
    if str.instance_of?(Array)
      widget.buffer.text += str.join("\r\n")
    else
      widget.buffer.text += str
    end
  end
end

def set_entry_str(widget,str)
  if str != nil
    if str.instance_of?(Array)
      widget.set_text str.join("/")
    else
      widget.set_text str
    end
  end
end

def on_entry_arg1_icon_press
  arg_input_dialog(0)
end
def on_entry_arg2_icon_press
  arg_input_dialog(1)
end
def on_entry_arg3_icon_press
  arg_input_dialog(2)
end
def on_entry_arg4_icon_press
  arg_input_dialog(3)
end
def on_entry_arg5_icon_press
  arg_input_dialog(4)
end
def on_entry_arg6_icon_press
  arg_input_dialog(5)
end
def arg_input_dialog(n)
    table,multi = $db.script_arg_input($category_str,$script_str,n)
    if table != nil
      dlg = TablePickDialog.new(table,multi)
      if dlg.run == Gtk::ResponseType::OK
        str = dlg.selected_value
        if str != ''
          set_entry_str( $entry_arg[n], dlg.selected_value )
        end
      end
    end
end

def get_indent_space(textstr,fpos)
  lhome = textstr.rindex("\n",fpos)
  if lhome == nil
      lhome = 0
  else
      lhome = lhome + 1
  end
  thome = lhome
  while textstr[thome] == " "
      thome=thome+1
  end
  return textstr.slice(lhome,thome - lhome)
end

def on_btn_ins_clicked
  source_view = $source_views[$note_script.page]
  source_view.grab_focus()
  code = $db.make_code($category_str,$script_str,$entry_arg.map{|w|w.text})
  code.gsub!("\n","\n"+get_indent_space(source_view.buffer.text,source_view.buffer.cursor_position))
  source_view.buffer.insert_at_cursor(code)
end

def on_btn_load_script_clicked
  table = $db.get_item_list
  if table != nil
    dlg = TablePickDialog.new(table,false)
    if dlg.run == Gtk::ResponseType::OK
      str = dlg.selected_value
      script = $db.get_item_script(str)
      script.size.times do |i|
        $source_views[i].buffer.text = script[i]
      end
      set_entry_str($entry_loaded_item_id,str)
      set_entry_str($entry_loaded_item_name,dlg.selected_key)
      $btn_inject_script.sensitive = true
    end
  end
end

def on_btn_copy_script_clicked
  str = $source_views.map{|x|x.buffer.text.dup}
  Gdk::beep() #to avoid gdk error,beep before copying script to clipboard
  Win32::Clipboard.set_data($db.decorate_to_yaml_format(str))
end

def on_btn_inject_script_clicked
  str = $source_views.map{|x|x.buffer.text.dup}
  if $db.inject_item_script($entry_loaded_item_id.text,str) == false
    md = Gtk::MessageDialog.new(:parent => nil, :type => :info, :buttons_type => :close, :message => "Failed to inject script\nPlease paste manually")
		md.signal_connect("response") do |widget, response|
			md.destroy
		end
		md.show_all
  end
  Gdk::beep()
end

# load setting files
puts 'load db files'
$db = RADB.new

# setting GUI
puts 'setup GUI'

builder = Gtk::Builder.new(file: 'ui.glade')

$win = builder.get_object('win')
$tee_view_script = builder.get_object('tee_view_script')
$entry_arg = [ builder.get_object('entry_arg1'), builder.get_object('entry_arg2'), builder.get_object('entry_arg3'), builder.get_object('entry_arg4'), builder.get_object('entry_arg5'), builder.get_object('entry_arg6')]
$label_script_desc = builder.get_object('label_script_desc')
$label_param_desc = [builder.get_object('label_param1_desc'), builder.get_object('label_param2_desc'), builder.get_object('label_param3_desc'), builder.get_object('label_param4_desc'), builder.get_object('label_param5_desc'), builder.get_object('label_param6_desc')]
$max_arg_num = $entry_arg.size
$entry_script_search = builder.get_object('entry_script_search')
$entry_loaded_item_id = builder.get_object('entry_loaded_item_id')
$entry_loaded_item_name = builder.get_object('entry_loaded_item_name')
$btn_inject_script = builder.get_object('btn_inject_script')
$note_script = builder.get_object('note_script')
$btn_inject_script.sensitive = false

keyword_provider = GtkSource::CompletionWords.new('keyword')
keyword_buffer = GtkSource::Buffer.new
File.open( 'auto_complete.txt', mode = "r") do |f|
  keyword_buffer.set_text(f.read)
end
keyword_provider.register(keyword_buffer)
$source_views=[]
[builder.get_object('window_text_script'),builder.get_object('window_text_equip_script'),builder.get_object('window_text_unequip_script')].each do |note|
  source_view = GtkSource::View.new()
  source_view.set_insert_spaces_instead_of_tabs(true)
  source_view.set_indent_width(2)
  source_view.set_auto_indent(true)
  source_view.set_highlight_current_line(true)
  source_view.buffer.set_language(GtkSource::LanguageManager.new().get_language("c"))
  note.add( source_view )

  text_completion = source_view.completion
  text_completion.auto_complete_delay=10
  view_provider = GtkSource::CompletionWords.new('this script')
  view_provider.register(source_view.buffer)
  text_completion.add_provider(view_provider) 
  text_completion.add_provider(keyword_provider) 
  $source_views.push(source_view)
end

# Setup TreeView Column
renderer = Gtk::CellRendererText.new
column = Gtk::TreeViewColumn.new( "key", renderer, :text => 1 )
column.set_title('Script')
$tee_view_script.append_column(column)
# 1col for display,1col for search DB( if display item is category, 0 is set to 2nd col.otherwise category name is set )
$script_model = Gtk::TreeStore.new(String,String)

# Setup Script Menu
update_script_tree_view('')

$tee_view_script.model=$script_model

builder.connect_signals { |handler| method(handler) }

$win.title = $win.title + ' v0.7'
$win.show_all

# hide param input entries
$max_arg_num.times{|i|
  hide_arg(i)
}

puts 'launch editor'
Gtk.main
