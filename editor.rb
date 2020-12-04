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

def on_tee_view_script_cursor_changed
  sel = $tee_view_script.selection
  if sel.selected
    $label_param_desc.each do |w|
      set_label_str(w,'')
    end
    $entry_arg.each do |w|
      w.hide
    end

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
        set_label_str($label_param_desc[i],$db.script_arg_desc(parent_str,disp_str,i))
        if arg_set_default == true
          set_entry_str( $entry_arg[i], $db.script_arg_default(parent_str,disp_str,i) )
        end
        $entry_arg[i].show
      end
    end
    $ignore_next_event = false
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

def on_entry_arg1_focus_in_event
  arg_input_dialog(0)
end
def on_entry_arg2_focus_in_event
  arg_input_dialog(1)
end
def on_entry_arg3_focus_in_event
  arg_input_dialog(2)
end
def on_entry_arg4_focus_in_event
  arg_input_dialog(3)
end
def on_entry_arg5_focus_in_event
  arg_input_dialog(4)
end
def on_entry_arg6_focus_in_event
  arg_input_dialog(5)
end
def arg_input_dialog(n)
  if $ignore_next_event == false
    table = $db.script_arg_input($category_str,$script_str,n)
    if table != nil
      dlg = TablePickDialog.new(table)
      $ignore_next_event = true
      if dlg.run == Gtk::ResponseType::OK
        str = dlg.selected_value
        if str != ''
          set_entry_str( $entry_arg[n], dlg.selected_value )
        end
      end
    end
  else
    $ignore_next_event = false
  end
end

def on_btn_ins_clicked
  code = $db.make_code($category_str,$script_str,$entry_arg.map{|w|w.text})
  $text_view_edit.buffer.insert_at_cursor(code)
  $text_view_edit.grab_focus()
end

def on_btn_copy_script_clicked
  str = get_text_view_str($text_view_edit).dup
  str = "    Script: |\n      " + str.gsub(/\n/,"\n\t\t\t").gsub(/\t/,"  ")
  Win32::Clipboard.set_data(str)
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
$entry_script_search = builder.get_object('entry_script_search')
window_text = builder.get_object('window_text')
$text_view_edit = GtkSource::View.new()#builder.get_object('text_view_edit')
$text_view_edit.set_insert_spaces_instead_of_tabs(true)
$text_view_edit.set_indent_width(2)
$text_view_edit.set_auto_indent(true)
$text_view_edit.set_highlight_current_line(true)
$text_view_edit.buffer.set_language(GtkSource::LanguageManager.new().get_language("c"))
window_text.add( $text_view_edit )

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

$win.title = $win.title + ' v0.1'
$win.show_all

# hide param input entries
$label_param_desc.each do |w|
  set_label_str(w,'')
end
$entry_arg.each do |w|
  w.hide
end

puts 'launch editor'
Gtk.main
