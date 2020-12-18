# -*- encoding: utf-8 -*-
require 'yaml'

class RADB
    def initialize
        puts '  loading config file...'
        editor_conf = YAML.load_file('config.yml')
        @enc = editor_conf['Encoding']
        if @enc == nil
            @enc = 'utf-8'
        end
        puts '  loading script db file...'
        @script_conf = YAML.load_file('script.yml')
        puts '  setting up script db...'
        script_conf_generate_search_str(editor_conf)
        puts '  loading const db file...'
        @const_conf = YAML.load_file('const.yml')
        @db = YAML.load_file('db.yml')
        puts '  loading item db files...'
        puts '    this may takes few minutes'
        @item_db = load_item_db(@db['Item'],@enc)
        puts '  loading skill db file...'
        @skill_db = load_skill_db(@db['Skill'],@enc)
        puts '  loading mob db file...'
        @mob_db = load_mob_db(@db['Mob'],@enc)
    end
    def load_item_db(files,enc)
        db = {}
        @item_raw = []
        fdb = {}
        files.size.times do |i|
            puts "    loading #{files[i]}..."
            File.open(files[i], mode = "r", encoding: enc+':utf-8') do |fr|
                str = fr.read
                x = YAML.load(str)
                if x['Body'] != nil
                    x['Body'].size.times do |j|
                        item = x['Body'][j]
                        id = item['Id']
                        name = item['Name']
                        if id != nil && name != nil
                            db[id] = name
                            fdb[id] = [i,j]
                        end
                    end
                end
                @item_raw.push(x)
            end
        end
        id_ary = db.keys.map{|x|x.to_s}
        name_ary = db.values
        findex = fdb.values
        return [name_ary,id_ary,findex].transpose
    end
    def load_skill_db(files,enc)
        db = {}
        files.each do |f|
            puts "    loading #{f}..."
            File.open(f, mode = "r", encoding: enc+':utf-8') do |fr|
                str = fr.read
                x = YAML.load(str)
                if x['Body'] != nil
                    x['Body'].each do |item|
                        id = item['Name']
                        name = item['Description']
                        if id != nil && name != nil
                            db[id] = name
                        end
                    end
                end
            end
        end
        id_ary = db.keys.map{|x|'"'+x+'"'}
        name_ary = db.values
        return [name_ary,id_ary].transpose
    end
    def load_mob_db(files,enc)
        db = {}
        files.each do |f|
            puts "    loading #{f}..."
            File.open(f, mode = "r", encoding: enc+':utf-8'){|fr|
                fr.each_line{|line|
                    if line =~ /^(\d+),[^,]+,([^,]+)/
                        db[$1]=$2
                    end
                }
            }
        end
        id_ary = db.keys.map{|x|x.to_s}
        name_ary = db.values
        return [name_ary,id_ary].transpose
    end
    def script_conf_generate_search_str(editor_conf)
        #load config
        if editor_conf != nil && editor_conf['SearchOption'] != nil
            @match_case = editor_conf['SearchOption']['MatchCase']
            include_desc = editor_conf['SearchOption']['SearchDescription']
        end
        if @match_case == nil || !(@match_case.is_a?(TrueClass) || @match_case.is_a?(FalseClass))
            @match_case = false
        end
        if include_desc == nil || !(include_desc.is_a?(TrueClass) || include_desc.is_a?(FalseClass))
            include_desc = false
        end
        #insert search string
        script_category_str().each do |category|
          script_name_str(category).each do |script|
            str = script.dup
            if include_desc == true
                str += script_desc(category,script)
            end
            dummy_arg = ['','','','','']
            str += make_code(category,script,dummy_arg)
            if @match_case == false
                str.downcase!
            end
            script_insert_search_string(category,script,str)
          end
        end
    end
    
    def get_filtered_script(filter)
        arr = []
        if @match_case == false
            filter.downcase!
        end
        script_category_str().each do |category|
          script_name_str(category).each do |script|
            if filter == '' || script_search_string_include?(category,script,filter)
                arr.push([category,script])
            end
          end
        end
        return arr
    end

    def pickup_category(category)
        return @script_conf.find{|v|v['Category']==category}
    end
    def pickup_script(category,script)
        v = pickup_category(category)
        if v == nil
            return nil
        end
        return v['Script'].find{|s|s['Name']==script}
    end
    def pickup_script_args(category,script)
        v = pickup_script(category,script)
        if v == nil
            return nil
        end
        return v['Args']
    end
    def pickup_script_arg(category,script,n)
        v = pickup_script_args(category,script)
        if v == nil || v.length <= n
            return nil
        end
        return v[n]
    end
    def script_category_str
        return @script_conf.map{|n|n['Category']}
    end
    def script_category_desc(category)
        v = pickup_category(category)
        if v == nil || v['Desc'] == nil
            return ""
        end
        return if_array_join_to_str(v['Desc'])
    end
    def script_name_str(category)
        v = pickup_category(category)
        if v == nil || v['Script'] == nil
            return []
        end
        return v['Script'].map{|n|n['Name']}
    end
    def script_desc(category,script)
        v = pickup_script(category,script)
        if v == nil || v['Desc'] == nil
            return ""
        end
        return if_array_join_to_str(v['Desc'])
    end
    def script_search_string_include?(category,script,str)
        v = pickup_script(category,script)
        if v == nil || v['SearchString'] == nil
            return false
        end
        return v['SearchString'].include?(str)
    end
    def script_insert_search_string(category,script,str)
        v = pickup_script(category,script)
        if v == nil
            return
        end
        v['SearchString'] = str
    end
    def script_arg_num(category,script)
        v = pickup_script_args(category,script)
        if v == nil
            return 0
        end
        return v.length
    end
    def script_arg_desc(category,script,n)
        v = pickup_script_arg(category,script,n)
        if v == nil || v['Desc'] == nil
            return ''
        end
        return if_array_join_to_str(v['Desc'])
    end
    def script_arg_default(category,script,n)
        v = pickup_script_arg(category,script,n)
        if v == nil || v['Default'] == nil
            return ''
        end
        return v['Default'].to_s
    end
    def script_arg_input_is_list?(category,script,n)
        t,m = script_arg_input(category,script,n)
        return t != nil
    end
    
    def script_arg_input(category,script,n)
        v = pickup_script_arg(category,script,n)
        if v == nil || v['Type'] == nil
            return nil,false
        end
        
        type = v['Type']
        input = nil
        multi = false
        case type
            when 'Value' then
            when 'Item' then
                input = @item_db
            when 'Mob' then
                input = @mob_db
            when 'Skill' then
                input = @skill_db
            when 'List' then
                name = v['ListName']
                if name != nil
                    listconf = @const_conf.find{|v|v['Name']==name}
                    if listconf != nil
                        input = listconf['List']
                        multi = listconf['MultiSelect']
                        if multi != true
                            multi = false
                        end
                    end
                end
        end
        return input,multi
    end
    def get_item_list
        return @item_db
    end
    def get_item_script(id)
        @item_db.each do |x|
            if x[1] == id
                script = [@item_raw[x[2][0]]['Body'][x[2][1]]['Script'],@item_raw[x[2][0]]['Body'][x[2][1]]['EquipScript'],@item_raw[x[2][0]]['Body'][x[2][1]]['UnEquipScript']]
                script.size.times do |i|
                    if script[i] == nil
                        script[i] = ""
                    end
                end
                return script
            end
        end
        return ["","",""]
    end
    def inject_item_script(id,script)
        @item_db.each do |x|
            if x[1] == id
                inj = ItemYamlInjecter.new(@db['Item'][x[2][0]],@enc)
                result = inj.inject_script(id,decorate_to_yaml_format(script))
                if result == true
                    @item_raw[x[2][0]]['Body'][x[2][1]]['Script'] = script[0]
                    @item_raw[x[2][0]]['Body'][x[2][1]]['EquipScript'] = script[1]
                    @item_raw[x[2][0]]['Body'][x[2][1]]['UnEquipScript'] = script[2]
                end
                return result
            end
        end
    end
    def make_code(category,script,arg)
        v = pickup_script(category,script)
        if v == nil || v['Script'] == nil
            return ""
        end
        code = v['Script'].dup
        arg.length.times do |i|
            code.gsub!("ARG#{i+1}",arg[i])
        end 
        if code[-1]!="\n" && ( v['ScriptNoReturn'] == nil || v['ScriptNoReturn'] == false )
            code = code + "\n"
        end
        return code
    end

    def decorate_to_yaml_format(script)
        str=""
        if script[0].length > 0
            str += "    Script: |\n      " + script[0].gsub(/\n/,"\n      ").gsub(/\t/,"  ")
            str.rstrip!
            str += "\n"
        end
        if script[1].length > 0
            str += "    EquipScript: |\n      " + script[1].gsub(/\n/,"\n      ").gsub(/\t/,"  ")
            str.rstrip!
            str += "\n"
        end
        if script[2].length > 0
            str += "    UnEquipScript: |\n      " + script[2].gsub(/\n/,"\n      ").gsub(/\t/,"  ")
            str.rstrip!
            str += "\n"
        end
        return str
    end

    def if_array_join_to_str(item)
        if item == nil
            return ''
        end
        if item.instance_of?(Array)
            return item.map{|x|x.to_s}.join("\n")
        else
            return item.to_s
        end
    end
end

class ItemYamlInjecter
    def initialize( file,encoding)
        File.open(file, mode = "r", encoding: encoding+':utf-8') do |f|
            @str = f.read
        end
        @encoding = encoding
        @file = file
    end
    def file_overwrite
        File.open(@file, mode = "w", encoding: @encoding) do |f|
            f.write(@str.encode(@encoding))
        end
    end

    def apply_file_break_line(str)
        tmp = @str.match(/\R/)[0]
        if tmp == nil
            tmp = "\n"
        end
        str.gsub!(/\R/,tmp)
    end
    def inject_script( id, script )
        script = apply_file_break_line(script)

        # find item text
        header,item,footer = extract_item(id)
        if item == nil
            return false
        end

        # delete existing script text
        item = delete_script(item)

        #make new file content
        @str = header.concat(item).concat(script).concat(footer)

        #write
        file_overwrite

        return true
    end
    def extract_item( id )
        id_index = @str.index(/^  [ -] Id: #{id.to_s}[ \t]*(#.*)?$/)
        if id_index == nil
            return @str,nil,nil
        end

        start_pos = @str.rindex(/^  - /,id_index+1)
        if start_pos == nil
            return @str,nil,nil
        end

        end_pos = @str.index(/^  - /,id_index+1)
        if end_pos == nil
            end_pos = @str.length
        end
        header = @str.slice(0,start_pos)
        item = @str.slice(start_pos,end_pos-start_pos)
        footer = @str.slice(start_pos, @str.length-end_pos)
        if footer == nil
            footer = ""
        end
        return header,item,footer
    end
    def delete_script( str )
        str = delete_script_sub( str, /^    Script:/ )
        str = delete_script_sub( str, /^    EquipScript:/ )
        return delete_script_sub( str, /^    UnEquipScript:/ )
    end
    def delete_script_sub( str, mark )
        
        start_pos = str.index( mark )
        if start_pos == nil
            return str
        end
        header = str.slice(0,start_pos)

        end_pos = str.index(/^    [^ ]/,start_pos+1)
        if end_pos == nil
            return header
        end
        script = str.slice(start_pos,end_pos-start_pos)

        return header + str.slice( end_pos, str.size - end_pos )
    end
end
