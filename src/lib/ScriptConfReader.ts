import { readTextFile } from '@tauri-apps/plugin-fs';
import { parse } from 'yaml';

export interface ScriptArgConf {
  Desc: string | string[];
  Type: 'Value' | 'List' | 'Item' | 'Mob' | 'Skill';
  ListName?: string;
  Default?: string | number;
}

export interface ScriptItemConf {
  Name: string;
  Desc: string | string[];
  Script: string;
  ScriptNoReturn?: boolean;
  Args?: ScriptArgConf[];
  SearchString?: string;
}

export interface ScriptCategoryConf {
  Category: string;
  Desc: string | string[];
  Script: ScriptItemConf[];
}

export interface ConstListConf {
  Name: string;
  MultiSelect?: boolean;
  List: string[] | string[][];
}

export class ScriptConfReader {
  public scripts: ScriptCategoryConf[] = [];
  public consts: ConstListConf[] = [];

  async load(scriptPath: string, constPath: string) {
    const scriptRaw = await readTextFile(scriptPath);
    const constRaw = await readTextFile(constPath);
    this.scripts = parse(scriptRaw) as ScriptCategoryConf[];
    this.consts = parse(constRaw) as ConstListConf[];
    this.generateSearchStrings();
  }

  private generateSearchStrings() {
    for (const cat of this.scripts) {
      for (const script of cat.Script) {
        let str = script.Name.toLowerCase();
        if (script.Desc) {
           str += (Array.isArray(script.Desc) ? script.Desc.join('') : script.Desc).toLowerCase();
        }
        script.SearchString = str;
      }
    }
  }

  getFilteredScripts(filter: string): { category: string, script: ScriptItemConf }[] {
    const query = filter.toLowerCase();
    const result: { category: string, script: ScriptItemConf }[] = [];
    for (const cat of this.scripts) {
      for (const script of cat.Script) {
        if (!filter || (script.SearchString && script.SearchString.includes(query))) {
          result.push({ category: cat.Category, script });
        }
      }
    }
    return result;
  }

  getConstList(listName: string): ConstListConf | undefined {
    return this.consts.find(c => c.Name === listName);
  }

  makeCode(scriptItem: ScriptItemConf, args: string[]): string {
    let code = scriptItem.Script;
    if (args) {
      for (let i = 0; i < args.length; i++) {
        const val = args[i] || '';
        code = code.replace(new RegExp(`ARG${i + 1}`, 'g'), val);
      }
    }
    if (!code.endsWith('\n') && !scriptItem.ScriptNoReturn) {
      code += '\n';
    }
    return code; // Keep original indentation logic for caller
  }
}
