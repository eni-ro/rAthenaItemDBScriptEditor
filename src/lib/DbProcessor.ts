/**
 * DbProcessor.ts
 * db_processor.exe (Tauri Sidecar) の呼び出しラッパー
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

/** アイテムをYAMLファイルに保存する */
export async function saveItemToYaml(item: ItemDbEntry, encoding = 'utf-8'): Promise<DbProcessorResult> {
  const data: Record<string, any> = {
    Id: item.id,
    AegisName: item.aegis_name,
    Name: item.name,
    Type: item.type,
    SubType: item.subType || null,
    Buy: item.buy ?? null,
    Sell: item.sell ?? null,
    Weight: item.weight || null,
    Attack: item.attack || null,
    MagicAttack: item.magicAttack || null,
    Defense: item.defense || null,
    Range: item.range || null,
    Slots: item.slots || null,
    Jobs: item.jobs && item.jobs.length > 0 ? item.jobs : null,
    Classes: item.classes && item.classes.length > 0 ? item.classes : null,
    Gender: item.gender && item.gender !== 'Both' ? item.gender : null,
    Locations: item.locations && item.locations.length > 0 ? item.locations : null,
    WeaponLevel: item.weaponLevel ?? null,
    ArmorLevel: item.armorLevel ?? null,
    EquipLevelMin: item.equipLevelMin || null,
    EquipLevelMax: item.equipLevelMax || null,
    Refineable: item.refineable || null,
    Gradable: item.gradable || null,
    View: item.view ?? null,
    AliasName: item.aliasName || null,
    Flags: item.flags && Object.values(item.flags).some(v => v) ? item.flags : null,
    Delay: item.delay?.Duration ? item.delay : null,
    Stack: item.stack?.Amount ? item.stack : null,
    NoUse: item.noUse?.Sitting ? item.noUse : null,
    Trade: item.trade && Object.entries(item.trade).some(([k, v]) => k !== 'Override' && v) ? item.trade : null,
    Script: item.script || null,
    EquipScript: item.equipScript || null,
    UnEquipScript: item.unEquipScript || null,
  };

  return callProcessor({
    action: 'update_item',
    file: item.filePath,
    aegis_name: item.aegis_name,
    data,
    encoding,
  });
}

/** コンボを更新する */
export async function updateComboInYaml(
  filePath: string,
  comboIndex: number,
  combos: string[][],
  script: string,
  encoding = 'utf-8',
): Promise<DbProcessorResult> {
  return callProcessor({
    action: 'update_combo',
    file: filePath,
    combo_index: comboIndex,
    data: { combos, script },
    encoding,
  });
}

/** コンボを新規追加する */
export async function addComboToYaml(
  filePath: string,
  combos: string[][],
  script: string,
  encoding = 'utf-8',
): Promise<DbProcessorResult> {
  return callProcessor({
    action: 'add_combo',
    file: filePath,
    data: { combos, script },
    encoding,
  });
}

/** コンボを削除する */
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

/** db.yml のパス設定を更新する */
export async function updateDbYml(
  filePath: string,
  config: {
    Encoding?: string;
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
