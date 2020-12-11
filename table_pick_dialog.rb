# -*- encoding: utf-8 -*-
require 'gtk3'
require 'yaml'

class TablePickDialog
    
    def initialize( table )
        ObjectSpace.define_finalizer(self, TablePickDialog.callback)

        @builder = Gtk::Builder.new(file: 'dialog.glade')
        @dlg = @builder.get_object('dlg')
        @tree_view_dlg_table = @builder.get_object('tree_view_dlg_table')
        @entry_filter = @builder.get_object('search_entry_dlg_filter')

        #Setup TreeView
        renderer = Gtk::CellRendererText.new
        @item_col = Gtk::TreeViewColumn.new( "key", renderer, :text => 0 )
        @item_col.set_title('Item')
        @tree_view_dlg_table.append_column(@item_col)
        @value_col = Gtk::TreeViewColumn.new( "key", renderer, :text => 1 )
        @value_col.set_title('Value')
        @tree_view_dlg_table.append_column(@value_col)
        @model = Gtk::ListStore.new(String,String)
        @tree_view_dlg_table.model=@model
        
        @current_table = table
        set_table('')
    end

    def TablePickDialog.callback
      proc {
        @dlg.destroy
      }
    end

    def on_search_entry_dlg_filter_changed
        set_table( @entry_filter.text.downcase )
    end

    def run
        @builder.connect_signals { |handler| method(handler) }
        result = @dlg.run
        if result == Gtk::ResponseType::OK
            store_selected_keyvalue()
        end
        @dlg.close
        return result
    end
    
    def set_table( filter)
        @model.clear
        if @current_table == nil || !@current_table.instance_of?(Array)
            return
        end
        if !@current_table[0].instance_of?(Array)
            @item_col.visible = false
        end
        # モデルを作成しデータを入れていく
        #@model = Gtk::ListStore.new(String,String)
        if @current_table[0].instance_of?(Array)
            @current_table.each do |row|
                if filter == '' || row[0].downcase.include?(filter) || row[1].downcase.include?(filter)
                    it_root = @model.append()
                    @model.set_value(it_root, 0, row[0])
                    @model.set_value(it_root, 1, row[1])
                end
            end
        else
            @current_table.each do |row|
                if filter == '' || row.downcase.include?(filter)
                    it_root = @model.append()
                    @model.set_value(it_root, 1, row)
                end
            end
        end
    end
    def on_tree_view_dlg_table_button_press_event(widget,event)
        if event.event_type == Gdk::EventType::BUTTON2_PRESS
            @dlg.response( Gtk::ResponseType::OK )
        end
    end
    def store_selected_keyvalue
        key = ''
        val = ''
        sel = @tree_view_dlg_table.selection
        if sel.selected
            key = @model.get_value(sel.selected,0)
            val = @model.get_value(sel.selected,1)
        end
        @selectedkey = key
        @selectedvalue = val
    end
    def selected_key
        return @selectedkey
    end
    def selected_value
        return @selectedvalue
    end
end
