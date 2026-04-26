import { invoke } from '@tauri-apps/api/core';
import * as jsYaml from 'js-yaml';

export interface DbEntry {
  aegis_name: string;
  name: string;
}

// ─── Jobs / Classes / Locations のマップ型 ───────────────────────────
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

// ─── アイテムDBエントリ ───────────────────────────────────────────────
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

// ─── コンボDBエントリ ─────────────────────────────────────────────────
export interface ComboEntry {
  items: string[];
}

export interface ComboDbEntry {
  index: number;
  filePath: string;
  combos: ComboEntry[];
  script: string;
}

// ─── ItemName エントリ ────────────────────────────────────────────────
export interface ItemNameEntry {
  id: number;
  name: string;
}

interface YamlDb {
  Header?: any;
  Body?: any[];
}

function extractBoolMap(map: any): string[] {
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
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
    script: item.Script || undefined,
    equipScript: item.EquipScript || undefined,
    unEquipScript: item.UnEquipScript || undefined,
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

/** エンコーディングを指定してYAMLファイルを読み込む */
async function readYaml(filePath: string, encoding: string): Promise<string> {
  const bytesArray = await invoke<number[]>('read_file_bytes', { path: filePath });
  let bytes = new Uint8Array(bytesArray);
  
  // UTF-8のゼロ幅スペース(E2 80 8B)をバイト列から除去
  bytes = removeByteSequence(bytes, [0xE2, 0x80, 0x8B]);
  
  const decoder = new TextDecoder(encoding.toLowerCase() === 'utf8' ? 'utf-8' : encoding);
  return decoder.decode(bytes);
}

export class DbReader {
  public items: ItemDbEntry[] = [];
  public skills: DbEntry[] = [];
  public mobs: DbEntry[] = [];
  public combos: ComboDbEntry[] = [];
  public itemNames: Map<number, string> = new Map();
  public encoding: string = 'utf-8';

  async load(dbPath: string) {
    // db.yml は常に UTF-8
    const dbRaw: string = await invoke('read_file_raw', { path: dbPath });
    const dbConf = jsYaml.load(dbRaw, { json: true }) as {
      Encoding?: string;
      Item?: string[];
      ItemCombos?: string[];
      ItemName?: string[];
      Skill?: string[];
      Mob?: string[];
    };

    // エンコーディング設定を取得（デフォルト: utf-8）
    this.encoding = dbConf.Encoding || 'utf-8';

    // ─── Item ────────────────────────────────────────────────────
    if (dbConf.Item) {
      for (const filePath of dbConf.Item) {
        try {
          const raw = await readYaml(filePath, this.encoding);
          const parsed = jsYaml.load(raw, { json: true }) as YamlDb;
          if (parsed?.Body) {
            for (const item of parsed.Body) {
              if (item.AegisName && item.Name) {
                this.items.push(parseItemEntry(item, filePath));
              }
            }
          }
        } catch (e: any) {
          this.items.push({
            id: 0, aegis_name: 'ERROR',
            name: `Read Error: ${filePath} - ${e?.message ?? e}`,
            filePath
          });
        }
      }
    }

    // ─── ItemCombos ──────────────────────────────────────────────
    if (dbConf.ItemCombos) {
      for (const filePath of dbConf.ItemCombos) {
        try {
          const raw = await readYaml(filePath, this.encoding);
          const parsed = jsYaml.load(raw, { json: true }) as YamlDb;
          if (parsed?.Body) {
            parsed.Body.forEach((entry: any, index: number) => {
              if (entry.Combos) {
                this.combos.push({
                  index,
                  filePath,
                  combos: entry.Combos.map((c: any) => ({
                    items: Array.isArray(c.Combo) ? c.Combo.map((x: any) => x.toString()) : [],
                  })),
                  script: entry.Script || '',
                });
              }
            });
          }
        } catch (e) {
          console.warn(`Failed to read ItemCombos: ${filePath}`, e);
        }
      }
    }

    // ─── ItemName ────────────────────────────────────────────────
    // ItemName は専用エンコーディングで読む（例: shift-jis）
    if (dbConf.ItemName) {
      for (const filePath of dbConf.ItemName) {
        try {
          const raw = await readYaml(filePath, this.encoding);
          const parsed = jsYaml.load(raw, { json: true }) as YamlDb;
          if (parsed?.Body) {
            for (const entry of parsed.Body) {
              if (entry.Id != null && entry.Name) {
                this.itemNames.set(Number(entry.Id), entry.Name.toString());
              }
            }
          }
        } catch (e) {
          console.warn(`Failed to read ItemName: ${filePath}`, e);
        }
      }
    }

    // ─── Skill ───────────────────────────────────────────────────
    if (dbConf.Skill) {
      for (const filePath of dbConf.Skill) {
        try {
          const raw = await readYaml(filePath, this.encoding);
          const parsed = jsYaml.load(raw, { json: true }) as YamlDb;
          if (parsed?.Body) {
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
          console.warn(`Failed to read Skill: ${filePath}`);
        }
      }
    }

    // ─── Mob ─────────────────────────────────────────────────────
    if (dbConf.Mob) {
      for (const filePath of dbConf.Mob) {
        try {
          const raw = await readYaml(filePath, this.encoding);
          const parsed = jsYaml.load(raw, { json: true }) as YamlDb;
          if (parsed?.Body) {
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
          console.warn(`Failed to read Mob: ${filePath}`, e);
        }
      }
    }
  }

  getItem(aegis_name: string): ItemDbEntry | undefined {
    return this.items.find(i => i.aegis_name === aegis_name);
  }

  getItemById(id: number): ItemDbEntry | undefined {
    return this.items.find(i => i.id === id);
  }

  getDisplayName(item: ItemDbEntry): string {
    const jpName = this.itemNames.get(item.id);
    const baseName = jpName || item.name;
    const slotsStr = item.slots != null ? `[${item.slots}]` : '';
    return `${baseName}${slotsStr}(${item.aegis_name})`;
  }

  getCombosForItem(aegis_name: string): ComboDbEntry[] {
    return this.combos.filter(combo =>
      combo.combos.some(c => c.items.includes(aegis_name))
    );
  }
}
