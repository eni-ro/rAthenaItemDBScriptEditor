import { invoke } from '@tauri-apps/api/core';
import * as jsYaml from 'js-yaml';

export interface DbEntry {
  aegis_name: string;
  name: string;
}

export interface ItemDbEntry extends DbEntry {
  filePath: string;
  script: string;
  equipScript: string;
  unEquipScript: string;
}

interface YamlDb {
  Header?: any;
  Body?: any[];
}

export class DbReader {
  public items: ItemDbEntry[] = [];
  public skills: DbEntry[] = [];
  public mobs: DbEntry[] = [];

  async load(dbPath: string) {
    const dbRaw: string = await invoke('read_file_raw', { path: dbPath });
    const dbConf = jsYaml.load(dbRaw, { json: true }) as { Item?: string[], Skill?: string[], Mob?: string[] };

    if (dbConf.Item) {
      for (const filePath of dbConf.Item) {
        try {
          const raw: string = await invoke('read_file_raw', { path: filePath });
          const parsed = jsYaml.load(raw, { json: true }) as YamlDb;
          if (parsed && parsed.Body) {
            for (const item of parsed.Body) {
              if (item.AegisName && item.Name) {
                this.items.push({
                  aegis_name: item.AegisName.toString(),
                  name: item.Name.toString(),
                  filePath,
                  script: item.Script || '',
                  equipScript: item.EquipScript || '',
                  unEquipScript: item.UnEquipScript || '',
                });
              }
            }
          }
        } catch (e: any) {
          this.items.push({
            aegis_name: 'ERROR',
            name: `Read Error: filepath : ${filePath} - ${e?.message ?? e}`,
            filePath,
            script: '', equipScript: '', unEquipScript: ''
          });
        }
      }
    }

    if (dbConf.Skill) {
      for (const filePath of dbConf.Skill) {
        try {
          const raw: string = await invoke('read_file_raw', { path: filePath });
          const parsed = jsYaml.load(raw, { json: true }) as YamlDb;
          if (parsed && parsed.Body) {
            for (const skill of parsed.Body) {
              if (skill.Name && skill.Description) {
                this.skills.push({
                  aegis_name: skill.Name.toString(),
                  name: skill.Description.toString(),
                });
              }
            }
          }
        } catch (e) {
          console.warn(`Failed to read Skill file: ${filePath}`);
        }
      }
    }

    if (dbConf.Mob) {
      for (const filePath of dbConf.Mob) {
        try {
          const raw: string = await invoke('read_file_raw', { path: filePath });
          const parsed = jsYaml.load(raw, { json: true }) as YamlDb;
          if (parsed && parsed.Body) {
            for (const mob of parsed.Body) {
              const name = mob.JapaneseName || mob.Name;
              if (mob.AegisName && name) {
                this.mobs.push({
                  aegis_name: mob.AegisName.toString(),
                  name: name.toString(),
                });
              }
            }
          }
        } catch (e) {
          console.warn(`Failed to read Mob file: ${filePath},${e}`);
        }
      }
    }
  }


  getItem(aegis_name: string): ItemDbEntry | undefined {
    return this.items.find(i => i.aegis_name === aegis_name);
  }
}
