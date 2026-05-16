import { invoke } from '@tauri-apps/api/core';
import { exists } from '@tauri-apps/plugin-fs';
import { parse as parseYaml } from 'yaml';

export interface DbEntry {
  id?: number;
  aegis_name: string;
  name: string;
}

// ─── Map types for Jobs / Classes / Locations ───────────────────────
export type BoolMap = Record<string, boolean>;

// ─── Flags ───────────────────────────────────────────────────────────
export interface ItemFlags {
  BuyingStore?: boolean;
  DeadBranch?: boolean;
  Container?: boolean;
  UniqueId?: boolean;
  BindOnEquip?: boolean;
  DropAnnounce?: boolean;
  NoConsume?: boolean;
  DropEffect?: boolean;
}

// ─── Delay ───────────────────────────────────────────────────────────
export interface ItemDelay {
  Duration?: number;
  Status?: string;
}

// ─── Stack ───────────────────────────────────────────────────────────
export interface ItemStack {
  Amount?: number;
  Inventory?: boolean;
  Cart?: boolean;
  Storage?: boolean;
  GuildStorage?: boolean;
}

// ─── NoUse ───────────────────────────────────────────────────────────
export interface ItemNoUse {
  Override?: number;
  Sitting?: boolean;
}

// ─── Trade ───────────────────────────────────────────────────────────
export interface ItemTrade {
  Override?: number;
  NoDrop?: boolean;
  NoTrade?: boolean;
  TradePartner?: boolean;
  NoSell?: boolean;
  NoCart?: boolean;
  NoStorage?: boolean;
  NoGuildStorage?: boolean;
  NoMail?: boolean;
  NoAuction?: boolean;
}

// ─── Item DB Entry ───────────────────────────────────────────────────
export interface ItemDbEntry extends DbEntry {
  id: number;
  filePath: string;
  type?: string;
  subType?: string;
  buy?: number;
  sell?: number;
  weight?: number;
  attack?: number;
  magicAttack?: number;
  defense?: number;
  range?: number;
  slots?: number;
  jobs?: string[];
  classes?: string[];
  gender?: string;
  locations?: string[];
  weaponLevel?: number;
  armorLevel?: number;
  equipLevelMin?: number;
  equipLevelMax?: number;
  refineable?: boolean;
  gradable?: boolean;
  view?: number;
  aliasName?: string;
  flags?: ItemFlags;
  delay?: ItemDelay;
  stack?: ItemStack;
  noUse?: ItemNoUse;
  trade?: ItemTrade;
  script?: string;
  equipScript?: string;
  unEquipScript?: string;
}

// ─── Combo DB Entry ──────────────────────────────────────────────────
export interface ComboEntry {
  items: string[];
}

export interface ComboDbEntry {
  index: number;
  filePath: string;
  combos: ComboEntry[];
  script: string;
}

export interface ItemNameEntry {
  id: number;
  name: string;
}

// ─── SkillName Entry ──────────────────────────────────────────────────
export interface SkillNameEntry {
  id: number;
  name: string;
}

export interface SkillDbEntry extends DbEntry {
  id: number;
}

interface YamlDb {
  Header?: any;
  Body?: any[];
  Footer?: {
    Imports?: {
      Path: string;
      Mode?: string;
    }[];
  };
}

function extractBoolMap(map: any): string[] {
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
}

function trimScript(s: any): string | undefined {
  if (s == null) return undefined;
  const str = s.toString();
  // Remove leading and trailing empty lines (including those with only whitespace)
  return str.replace(/^(\s*[\r\n])+/g, '').replace(/([\r\n]\s*)+$/g, '');
}

function parseItemEntry(item: any, filePath: string): ItemDbEntry {
  return {
    id: Number(item.Id) || 0,
    aegis_name: item.AegisName?.toString() || '',
    name: item.Name?.toString() || '',
    filePath,
    type: item.Type?.toString(),
    subType: item.SubType?.toString(),
    buy: item.Buy != null ? Number(item.Buy) : undefined,
    sell: item.Sell != null ? Number(item.Sell) : undefined,
    weight: item.Weight != null ? Number(item.Weight) : undefined,
    attack: item.Attack != null ? Number(item.Attack) : undefined,
    magicAttack: item.MagicAttack != null ? Number(item.MagicAttack) : undefined,
    defense: item.Defense != null ? Number(item.Defense) : undefined,
    range: item.Range != null ? Number(item.Range) : undefined,
    slots: item.Slots != null ? Number(item.Slots) : undefined,
    jobs: item.Jobs ? extractBoolMap(item.Jobs) : undefined,
    classes: item.Classes ? extractBoolMap(item.Classes) : undefined,
    gender: item.Gender?.toString(),
    locations: item.Locations ? extractBoolMap(item.Locations) : undefined,
    weaponLevel: item.WeaponLevel != null ? Number(item.WeaponLevel) : undefined,
    armorLevel: item.ArmorLevel != null ? Number(item.ArmorLevel) : undefined,
    equipLevelMin: item.EquipLevelMin != null ? Number(item.EquipLevelMin) : undefined,
    equipLevelMax: item.EquipLevelMax != null ? Number(item.EquipLevelMax) : undefined,
    refineable: item.Refineable != null ? item.Refineable === true : undefined,
    gradable: item.Gradable != null ? item.Gradable === true : undefined,
    view: item.View != null ? Number(item.View) : undefined,
    aliasName: item.AliasName?.toString(),
    flags: item.Flags ? {
      BuyingStore: item.Flags.BuyingStore === true ? true : undefined,
      DeadBranch: item.Flags.DeadBranch === true ? true : undefined,
      Container: item.Flags.Container === true ? true : undefined,
      UniqueId: item.Flags.UniqueId === true ? true : undefined,
      BindOnEquip: item.Flags.BindOnEquip === true ? true : undefined,
      DropAnnounce: item.Flags.DropAnnounce === true ? true : undefined,
      NoConsume: item.Flags.NoConsume === true ? true : undefined,
      DropEffect: item.Flags.DropEffect === true ? true : undefined,
    } : undefined,
    delay: item.Delay ? {
      Duration: item.Delay.Duration != null ? Number(item.Delay.Duration) : undefined,
      Status: item.Delay.Status?.toString(),
    } : undefined,
    stack: item.Stack ? {
      Amount: item.Stack.Amount != null ? Number(item.Stack.Amount) : undefined,
      Inventory: item.Stack.Inventory === true ? true : undefined,
      Cart: item.Stack.Cart === true ? true : undefined,
      Storage: item.Stack.Storage === true ? true : undefined,
      GuildStorage: item.Stack.GuildStorage === true ? true : undefined,
    } : undefined,
    noUse: item.NoUse ? {
      Override: item.NoUse.Override != null ? Number(item.NoUse.Override) : undefined,
      Sitting: item.NoUse.Sitting === true ? true : undefined,
    } : undefined,
    trade: item.Trade ? {
      Override: item.Trade.Override != null ? Number(item.Trade.Override) : undefined,
      NoDrop: item.Trade.NoDrop === true ? true : undefined,
      NoTrade: item.Trade.NoTrade === true ? true : undefined,
      TradePartner: item.Trade.TradePartner === true ? true : undefined,
      NoSell: item.Trade.NoSell === true ? true : undefined,
      NoCart: item.Trade.NoCart === true ? true : undefined,
      NoStorage: item.Trade.NoStorage === true ? true : undefined,
      NoGuildStorage: item.Trade.NoGuildStorage === true ? true : undefined,
      NoMail: item.Trade.NoMail === true ? true : undefined,
      NoAuction: item.Trade.NoAuction === true ? true : undefined,
    } : undefined,
    script: trimScript(item.Script),
    equipScript: trimScript(item.EquipScript),
    unEquipScript: trimScript(item.UnEquipScript),
  };
}

function removeByteSequence(source: Uint8Array, seq: number[]): Uint8Array {
  const result: number[] = [];
  for (let i = 0; i < source.length; i++) {
    let match = true;
    for (let j = 0; j < seq.length; j++) {
      if (source[i + j] !== seq[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      i += seq.length - 1;
    } else {
      result.push(source[i]);
    }
  }
  return new Uint8Array(result);
}



/** Read YAML file with specified encoding */
async function readYaml(filePath: string, encoding: string): Promise<string> {
  let raw: string;
  try {
    // Try using the robust Rust-side decoder first
    raw = await invoke<string>('read_file_encoded', { path: filePath, encoding });
  } catch (e) {
    console.warn(`Rust-side decode failed for ${filePath}, falling back to JS decoder:`, e);
    const bytesArray = await invoke<number[]>('read_file_bytes', { path: filePath });
    let bytes = new Uint8Array(bytesArray);
    
    // Fallback: remove UTF-8 Zero Width Space (E2 80 8B) if it's UTF-8
    bytes = removeByteSequence(bytes, [0xE2, 0x80, 0x8B]);
    
    const decoder = new TextDecoder(encoding);
    raw = decoder.decode(bytes);
  }
  
  // Comprehensive cleaning of non-printable characters that cause YAML parsers to fail.
  // We remove:
  // - Control characters (00-1F except 09, 0A, 0D)
  // - DEL (7F)
  // - C1 control characters (80-9F)
  // - Zero Width characters (U+200B to U+200D, U+FEFF)
  return raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\u200B-\u200D\uFEFF]/g, '');
}

export class DbReader {
  public items: ItemDbEntry[] = [];
  public skills: SkillDbEntry[] = [];
  public mobs: DbEntry[] = [];
  public combos: ComboDbEntry[] = [];
  public itemNames: Map<number, string> = new Map();
  public skillNames: Map<number, string> = new Map();
  public itemFiles: string[] = [];
  public comboFiles: string[] = [];
  public configItemFiles: string[] = ['db/item_db.yml'];
  public configComboFiles: string[] = ['db/item_combos.yml'];
  public configItemNameFiles: string[] = [];
  public configSkillFiles: string[] = ['db/skill_db.yml'];
  public configSkillNameFiles: string[] = [];
  public configMobFiles: string[] = ['db/mob_db.yml'];
  public encoding: string = 'utf-8';
  public rustEncoding: string = 'utf-8';
  public pythonEncoding: string = 'utf-8';
  public sortOnInsert: boolean = true;
  public sortOnUpdate: boolean = false;
  public divinePrideKey: string = 'YourApiToken';
  public rAthenaRoot: string = 'C:/rAthena';
  public mode: 'Renewal' | 'Prerenewal' = 'Renewal';
  public enableFuzzyDivinePride: boolean = false;
  public divinePrideRangeSource: 'api' | 'fuzzy' = 'api';
  public showComboComments: boolean = true;
  public formatOnSave: boolean = true;
  public errors: string[] = [];

  private async resolvePath(path: string): Promise<string> {
    if (!path) return '';
    // Normalize to forward slashes
    let p = path.replace(/\\/g, '/');
    // Check if absolute (starts with / or has C:)
    if (p.startsWith('/') || p.includes(':')) return p;

    if (this.rAthenaRoot) {
      const rPath = this.join(this.rAthenaRoot, p);
      if (await exists(rPath)) return rPath.replace(/\\/g, '/');
    }

    const exeDir = await invoke<string>('get_exe_dir');
    return this.join(exeDir, p).replace(/\\/g, '/');
  }

  private join(dir: string, file: string): string {
    const sep = '/';
    const cleanDir = dir.endsWith('\\') || dir.endsWith('/') ? dir.slice(0, -1) : dir;
    const cleanFile = file.startsWith('\\') || file.startsWith('/') ? file.slice(1) : file;
    return (cleanDir + sep + cleanFile).replace(/\\/g, '/');
  }

  async load(dbPath: string) {
    // Clear existing data to avoid duplicates if load is called multiple times
    this.items = [];
    this.skills = [];
    this.mobs = [];
    this.combos = [];
    this.itemNames.clear();
    this.skillNames.clear();
    this.itemFiles = [];
    this.comboFiles = [];
    this.errors = [];

    // db.yml is always UTF-8
    let dbConf: any = {};
    try {
      const dbRaw: string = await invoke('read_file_raw', { path: dbPath });
      dbConf = parseYaml(dbRaw, { uniqueKeys: false }) || {};
    } catch (e) {
      console.warn(`db.yml not found or invalid at ${dbPath}. Using defaults.`);
    }

    // Get sorting settings.
    this.sortOnInsert = dbConf.SortOnInsert ?? this.sortOnInsert;
    this.sortOnUpdate = dbConf.SortOnUpdate ?? this.sortOnUpdate;
    this.divinePrideKey = dbConf.DivinePrideKey ?? this.divinePrideKey;
    this.rAthenaRoot = dbConf.rAthenaRoot ?? this.rAthenaRoot;
    this.mode = dbConf.Mode ?? this.mode;
    this.enableFuzzyDivinePride = dbConf.EnableFuzzyDivinePride ?? this.enableFuzzyDivinePride;
    this.divinePrideRangeSource = dbConf.DivinePrideRangeSource ?? this.divinePrideRangeSource;
    this.showComboComments = dbConf.ShowComboComments ?? this.showComboComments;
    this.formatOnSave = dbConf.FormatOnSave ?? this.formatOnSave;

    // Get encoding settings. 
    this.encoding = dbConf.TypeScriptEncoding || (dbConf as any).Encoding || this.encoding;
    this.rustEncoding = dbConf.RustEncoding || (dbConf as any).Encoding || this.rustEncoding;
    this.pythonEncoding = dbConf.PythonEncoding || (dbConf as any).Encoding || this.pythonEncoding;

    this.configItemFiles = dbConf.Item || this.configItemFiles;
    this.configComboFiles = dbConf.ItemCombos || this.configComboFiles;
    this.configItemNameFiles = dbConf.ItemName || this.configItemNameFiles;
    this.configSkillFiles = dbConf.Skill || this.configSkillFiles;
    this.configSkillNameFiles = dbConf.SkillName || this.configSkillNameFiles;
    this.configMobFiles = dbConf.Mob || this.configMobFiles;
    this.itemFiles = [];
    this.comboFiles = [];

    // ─── Recursive Loaders ──────────────────────────────────────
    const loadedFiles = new Set<string>();

    const loadItemsRecursive = async (filePath: string) => {
      const resolved = await this.resolvePath(filePath);
      if (loadedFiles.has(resolved)) return;
      loadedFiles.add(resolved);

      try {
        const raw = await readYaml(resolved, this.encoding);
        const parsed = parseYaml(raw, { uniqueKeys: false }) as YamlDb;
        
        // Add to itemFiles list for candidates
        if (!this.itemFiles.includes(resolved)) {
          this.itemFiles.push(resolved);
        }

        if (parsed?.Body) {
          for (const item of parsed.Body) {
            if (item.AegisName && item.Name) {
              this.items.push(parseItemEntry(item, resolved));
            }
          }
        }

        // Process Footer Imports
        if (parsed?.Footer?.Imports) {
          for (const imp of parsed.Footer.Imports) {
            if (imp.Mode && imp.Mode.toLowerCase() !== this.mode.toLowerCase()) continue;
            // resolvePath inside loadItemsRecursive will handle rAthenaRoot -> exeDir fallback
            await loadItemsRecursive(imp.Path);
          }
        }
      } catch (e: any) {
        this.errors.push(`Failed to read Item DB: ${resolved} - ${e?.message ?? e}`);
      }
    };

    const loadCombosRecursive = async (filePath: string) => {
      const resolved = await this.resolvePath(filePath);
      if (loadedFiles.has(resolved)) return;
      loadedFiles.add(resolved);

      try {
        const raw = await readYaml(resolved, this.encoding);
        const parsed = parseYaml(raw, { uniqueKeys: false }) as YamlDb;

        if (!this.comboFiles.includes(resolved)) {
          this.comboFiles.push(resolved);
        }

        if (parsed?.Body) {
          parsed.Body.forEach((entry: any, index: number) => {
            if (entry.Combos) {
              this.combos.push({
                index,
                filePath: resolved,
                combos: entry.Combos.map((c: any) => ({
                  items: Array.isArray(c.Combo) ? c.Combo.map((x: any) => x.toString()) : [],
                })),
                script: trimScript(entry.Script) || '',
              });
            }
          });
        }

        if (parsed?.Footer?.Imports) {
          for (const imp of parsed.Footer.Imports) {
            if (imp.Mode && imp.Mode.toLowerCase() !== this.mode.toLowerCase()) continue;
            await loadCombosRecursive(imp.Path);
          }
        }
      } catch (e: any) {
        this.errors.push(`Failed to read ItemCombos: ${resolved} - ${e?.message ?? e}`);
      }
    };

    const loadSkillsRecursive = async (filePath: string) => {
      const resolved = await this.resolvePath(filePath);
      if (loadedFiles.has(resolved)) return;
      loadedFiles.add(resolved);

      try {
        const raw = await readYaml(resolved, this.encoding);
        const parsed = parseYaml(raw, { uniqueKeys: false }) as YamlDb;

        if (parsed?.Body) {
          for (const skill of parsed.Body) {
            const sid = skill.Id ?? skill.id;
            const sname = skill.Name ?? skill.name;
            if (sid != null && sname) {
              this.skills.push({
                id: Number(sid),
                aegis_name: sname.toString(),
                name: (skill.Description || skill.description || sname).toString(),
              });
            }
          }
        }

        if (parsed?.Footer?.Imports) {
          for (const imp of parsed.Footer.Imports) {
            if (imp.Mode && imp.Mode.toLowerCase() !== this.mode.toLowerCase()) continue;
            await loadSkillsRecursive(imp.Path);
          }
        }
      } catch (e: any) {
        this.errors.push(`Failed to read Skill: ${resolved} - ${e?.message ?? e}`);
      }
    };

    const loadMobsRecursive = async (filePath: string) => {
      const resolved = await this.resolvePath(filePath);
      if (loadedFiles.has(resolved)) return;
      loadedFiles.add(resolved);

      try {
        const raw = await readYaml(resolved, this.encoding);
        const parsed = parseYaml(raw, { uniqueKeys: false }) as YamlDb;

        if (parsed?.Body) {
          for (const mob of parsed.Body) {
            const name = mob.JapaneseName || mob.Name;
            if (mob.AegisName && name) {
              this.mobs.push({
                id: mob.Id != null ? Number(mob.Id) : undefined,
                aegis_name: mob.AegisName.toString(),
                name: name.toString(),
              });
            }
          }
        }

        if (parsed?.Footer?.Imports) {
          for (const imp of parsed.Footer.Imports) {
            if (imp.Mode && imp.Mode.toLowerCase() !== this.mode.toLowerCase()) continue;
            await loadMobsRecursive(imp.Path);
          }
        }
      } catch (e: any) {
        this.errors.push(`Failed to read Mob: ${resolved} - ${e?.message ?? e}`);
      }
    };

    // ─── Item ────────────────────────────────────────────────────
    if (this.configItemFiles) {
      for (const filePath of this.configItemFiles) {
        await loadItemsRecursive(filePath);
      }
    }

    // ─── ItemCombos ──────────────────────────────────────────────
    loadedFiles.clear();
    if (this.configComboFiles) {
      for (const filePath of this.configComboFiles) {
        await loadCombosRecursive(filePath);
      }
    }

    // ─── ItemName ────────────────────────────────────────────────
    if (dbConf.ItemName) {
      for (const filePath of dbConf.ItemName) {
        try {
          const resolved = await this.resolvePath(filePath);
          const raw = await readYaml(resolved, this.encoding);
          const parsed = parseYaml(raw, { uniqueKeys: false }) as YamlDb;
          if (parsed?.Body) {
            for (const entry of parsed.Body) {
              if (entry.Id != null && entry.Name) {
                this.itemNames.set(Number(entry.Id), entry.Name.toString());
              }
            }
          }
        } catch (e: any) {
          this.errors.push(`Failed to read ItemName: ${filePath} - ${e?.message ?? e}`);
        }
      }
    }

    // ─── Skill ───────────────────────────────────────────────────
    loadedFiles.clear();
    if (this.configSkillFiles) {
      for (const filePath of this.configSkillFiles) {
        await loadSkillsRecursive(filePath);
      }
    }

    // ─── SkillName ────────────────────────────────────────────────
    if (dbConf.SkillName) {
      for (const filePath of dbConf.SkillName) {
        try {
          const resolved = await this.resolvePath(filePath);
          const raw = await readYaml(resolved, this.encoding);
          const parsed = parseYaml(raw, { uniqueKeys: false }) as YamlDb;
          if (parsed?.Body) {
            for (const entry of parsed.Body) {
              const sid = entry.Id ?? entry.id;
              const sname = entry.Name ?? entry.name;
              if (sid != null && sname) {
                this.skillNames.set(Number(sid), sname.toString());
              }
            }
          }
        } catch (e: any) {
          this.errors.push(`Failed to read SkillName: ${filePath} - ${e?.message ?? e}`);
        }
      }
    }

    // ─── Mob ─────────────────────────────────────────────────────
    loadedFiles.clear();
    if (this.configMobFiles) {
      for (const filePath of this.configMobFiles) {
        await loadMobsRecursive(filePath);
      }
    }
  }

  getItem(aegis_name: string, filePath?: string): ItemDbEntry | undefined {
    if (filePath) {
      return this.items.find(i => i.aegis_name === aegis_name && i.filePath === filePath);
    }
    return this.items.find(i => i.aegis_name === aegis_name);
  }

  getItemById(id: number, filePath?: string): ItemDbEntry | undefined {
    if (filePath) {
      return this.items.find(i => i.id === id && i.filePath === filePath);
    }
    return this.items.find(i => i.id === id);
  }

  getDisplayName(item: ItemDbEntry): string {
    const jpName = this.itemNames.get(item.id);
    const baseName = jpName || item.name;
    const slotsStr = item.slots != null ? `[${item.slots}]` : '';
    return `${baseName}${slotsStr}(${item.aegis_name})`;
  }

  getSkillDisplayName(skill: SkillDbEntry): string {
    const jpName = this.skillNames.get(skill.id);
    const baseName = jpName || skill.name;
    return `${baseName}(${skill.aegis_name})`;
  }

  getMobDisplayName(mob: DbEntry): string {
    const idStr = mob.id != null ? `(${mob.id})` : '';
    return `${mob.name}${idStr}(${mob.aegis_name})`;
  }

  getCombosForItem(aegis_name: string): ComboDbEntry[] {
    return this.combos.filter(combo =>
      combo.combos.some(c => c.items.includes(aegis_name))
    );
  }
}
