/**
 * DbProcessor.ts
 * Wrapper for calling db_processor.exe (Tauri Sidecar)
 */
import { invoke } from '@tauri-apps/api/core';
import type { ItemDbEntry } from './DbReader';

export interface DbProcessorResult {
  success: boolean;
  error?: string;
  index?: number;
}

async function callProcessor(request: object): Promise<DbProcessorResult> {
  const json = JSON.stringify(request);
  const raw: string = await invoke('invoke_db_processor', { jsonInput: json });
  return JSON.parse(raw) as DbProcessorResult;
}

/** Save item to YAML file */
export async function saveItemToYaml(
  item: ItemDbEntry,
  encoding = 'utf-8',
  originalAegisName?: string,
  options?: { sort_on_update?: boolean }
): Promise<DbProcessorResult> {
  const data: Record<string, any> = {
    Id: item.id,
    AegisName: item.aegis_name,
    Name: item.name,
    Type: item.type,
    SubType: item.subType ?? null,
    Buy: item.buy ?? null,
    Sell: item.sell ?? null,
    Weight: item.weight ?? null,
    Attack: item.attack ?? null,
    MagicAttack: item.magicAttack ?? null,
    Defense: item.defense ?? null,
    Range: item.range ?? null,
    Slots: item.slots ?? null,
    Jobs: item.jobs && item.jobs.length > 0 ? item.jobs : null,
    Classes: item.classes && item.classes.length > 0 ? item.classes : null,
    Gender: item.gender ?? null,
    Locations: item.locations && item.locations.length > 0 ? item.locations : null,
    WeaponLevel: item.weaponLevel ?? null,
    ArmorLevel: item.armorLevel ?? null,
    EquipLevelMin: item.equipLevelMin ?? null,
    EquipLevelMax: item.equipLevelMax ?? null,
    Refineable: item.refineable ?? null,
    Gradable: item.gradable ?? null,
    View: item.view ?? null,
    AliasName: item.aliasName ?? null,
    Flags: item.flags && Object.values(item.flags).some(v => v) ? item.flags : null,
    Delay: item.delay?.Duration ? item.delay : null,
    Stack: item.stack?.Amount ? item.stack : null,
    NoUse: item.noUse?.Sitting ? item.noUse : null,
    Trade: item.trade && Object.entries(item.trade).some(([k, v]) => k !== 'Override' && v) ? item.trade : null,
    Script: item.script ?? null,
    EquipScript: item.equipScript ?? null,
    UnEquipScript: item.unEquipScript ?? null,
  };

  return callProcessor({
    action: 'update_item',
    file: item.filePath,
    aegis_name: (originalAegisName !== undefined) ? originalAegisName : item.aegis_name,
    data,
    encoding,
    sort_on_update: options?.sort_on_update,
  });
}

/** Add new item to YAML file */
export async function addItemToYaml(
  item: ItemDbEntry,
  encoding = 'utf-8',
  options?: { sort_on_insert?: boolean }
): Promise<DbProcessorResult> {
  const data: Record<string, any> = {
    Id: item.id,
    AegisName: item.aegis_name,
    Name: item.name,
    Type: item.type,
    SubType: item.subType ?? null,
    Buy: item.buy ?? null,
    Sell: item.sell ?? null,
    Weight: item.weight ?? null,
    Attack: item.attack ?? null,
    MagicAttack: item.magicAttack ?? null,
    Defense: item.defense ?? null,
    Range: item.range ?? null,
    Slots: item.slots ?? null,
    Jobs: item.jobs && item.jobs.length > 0 ? item.jobs : null,
    Classes: item.classes && item.classes.length > 0 ? item.classes : null,
    Gender: item.gender ?? null,
    Locations: item.locations && item.locations.length > 0 ? item.locations : null,
    WeaponLevel: item.weaponLevel ?? null,
    ArmorLevel: item.armorLevel ?? null,
    EquipLevelMin: item.equipLevelMin ?? null,
    EquipLevelMax: item.equipLevelMax ?? null,
    Refineable: item.refineable ?? null,
    Gradable: item.gradable ?? null,
    View: item.view ?? null,
    AliasName: item.aliasName ?? null,
    Flags: item.flags && Object.values(item.flags).some(v => v) ? item.flags : null,
    Delay: item.delay?.Duration ? item.delay : null,
    Stack: item.stack?.Amount ? item.stack : null,
    NoUse: item.noUse?.Sitting ? item.noUse : null,
    Trade: item.trade && Object.entries(item.trade).some(([k, v]) => k !== 'Override' && v) ? item.trade : null,
    Script: item.script ?? null,
    EquipScript: item.equipScript ?? null,
    UnEquipScript: item.unEquipScript ?? null,
  };

  return callProcessor({
    action: 'add_item',
    file: item.filePath,
    data,
    encoding,
    sort_on_insert: options?.sort_on_insert,
  });
}

/** Delete item from YAML file */
export async function deleteItemFromYaml(filePath: string, aegis_name: string, encoding = 'utf-8'): Promise<DbProcessorResult> {
  return callProcessor({
    action: 'delete_item',
    file: filePath,
    aegis_name,
    encoding,
  });
}

/** Update combo */
export async function updateComboInYaml(
  filePath: string,
  comboIndex: number,
  combos: string[][],
  script: string,
  encoding = 'utf-8',
  itemInfo?: Record<string, string>,
): Promise<DbProcessorResult> {
  return callProcessor({
    action: 'update_combo',
    file: filePath,
    combo_index: comboIndex,
    data: { combos, script },
    encoding,
    item_info: itemInfo,
  });
}

/** Add new combo */
export async function addComboToYaml(
  filePath: string,
  combos: string[][],
  script: string,
  encoding = 'utf-8',
  itemInfo?: Record<string, string>,
): Promise<DbProcessorResult> {
  return callProcessor({
    action: 'add_combo',
    file: filePath,
    data: { combos, script },
    encoding,
    item_info: itemInfo,
  });
}

/** Delete combo */
export async function deleteComboFromYaml(
  filePath: string,
  comboIndex: number,
  encoding = 'utf-8',
): Promise<DbProcessorResult> {
  return callProcessor({
    action: 'delete_combo',
    file: filePath,
    combo_index: comboIndex,
    encoding,
  });
}

/** Update path settings in db.yml */
export async function updateDbYml(
  filePath: string,
  config: {
    Encoding?: string;
    TypeScriptEncoding?: string;
    PythonEncoding?: string;
    RustEncoding?: string;
    Item?: string[];
    ItemCombos?: string[];
    ItemName?: string[];
    Mob?: string[];
    Skill?: string[];
  },
): Promise<DbProcessorResult> {
  return callProcessor({
    action: 'update_db_yml',
    file: filePath,
    data: config,
  });
}

/** Fetch item data from DivinePride */
export async function fetchDivinePride(id: number, apiKey: string, server = 'jro'): Promise<DbProcessorResult & { data?: any }> {
  return callProcessor({
    action: 'fetch_divine_pride',
    id,
    api_key: apiKey,
    server,
  }) as Promise<DbProcessorResult & { data?: any }>;
}
