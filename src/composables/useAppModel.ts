import { ref, shallowRef } from 'vue';
import { ScriptConfReader, ScriptCategoryConf, ScriptItemConf, ConstListConf } from '../lib/ScriptConfReader';
import { DbReader, ItemDbEntry, ComboDbEntry } from '../lib/DbReader';

// Global state model
export const useAppModel = () => {
  const scriptReader = new ScriptConfReader();
  const dbReader = new DbReader();

  const isLoaded = ref(false);

  // Data items for current loaded script
  const categories = shallowRef<ScriptCategoryConf[]>([]);
  const consts = shallowRef<ConstListConf[]>([]);

  // 現在選択中のアイテム
  const currentItem = ref<ItemDbEntry | null>(null);

  // 現在選択中のコンボ
  const currentCombo = ref<ComboDbEntry | null>(null);

  // メインタブ: 'items' | 'combos'
  const mainTab = ref<'items' | 'combos'>('items');

  // db.yml のパス (ロード時にキャッシュ)
  const dbYmlPath = ref<string>('');

  async function loadData(scriptPath: string, constPath: string, dbPath: string) {
    dbYmlPath.value = dbPath;
    await scriptReader.load(scriptPath, constPath);
    categories.value = scriptReader.scripts;
    consts.value = scriptReader.consts;

    await dbReader.load(dbPath);
    isLoaded.value = true;
  }

  function getItems() {
    return dbReader.items;
  }

  function getSkills() {
    return dbReader.skills;
  }

  function getMobs() {
    return dbReader.mobs;
  }

  function getCombos() {
    return dbReader.combos;
  }

  function getItemNames() {
    return dbReader.itemNames;
  }

  function getDisplayName(item: ItemDbEntry): string {
    return dbReader.getDisplayName(item);
  }

  /** アイテムIDから検索名(なければ英名)を返す */
  function getItemSearchName(aegis_name: string): string {
    const item = dbReader.getItem(aegis_name);
    if (!item) return aegis_name;
    return dbReader.getDisplayName(item);
  }

  function loadItem(aegis_name: string) {
    const item = dbReader.getItem(aegis_name);
    if (item) {
      currentItem.value = { ...item }; // trigger reactivity
      mainTab.value = 'items';
    }
  }

  function loadCombo(combo: ComboDbEntry) {
    currentCombo.value = { ...combo, combos: combo.combos.map(c => ({ ...c, items: [...c.items] })) };
    mainTab.value = 'combos';
  }

  function getConstList(name: string) {
    return scriptReader.getConstList(name);
  }

  function makeCode(script: ScriptItemConf, args: string[]) {
    return scriptReader.makeCode(script, args);
  }

  /** コンボリストをリロードなしで更新する（保存後の同期用） */
  function updateComboInMemory(combo: ComboDbEntry) {
    const idx = dbReader.combos.findIndex(c => c.filePath === combo.filePath && c.index === combo.index);
    if (idx >= 0) {
      dbReader.combos[idx] = combo;
    } else {
      dbReader.combos.push(combo);
    }
  }

  /** 新規コンボをメモリに追加する */
  function addComboToMemory(combo: ComboDbEntry) {
    dbReader.combos.push(combo);
  }

  /** コンボをメモリから削除する */
  function deleteComboFromMemory(filePath: string, index: number) {
    const idx = dbReader.combos.findIndex(c => c.filePath === filePath && c.index === index);
    if (idx >= 0) {
      dbReader.combos.splice(idx, 1);
      // 以降のインデックスをデクリメント
      dbReader.combos.forEach(c => {
        if (c.filePath === filePath && c.index > index) {
          c.index -= 1;
        }
      });
    }
  }

  return {
    isLoaded,
    categories,
    consts,
    currentItem,
    currentCombo,
    mainTab,
    dbYmlPath,
    loadData,
    getItems,
    getSkills,
    getMobs,
    getCombos,
    getItemNames,
    getDisplayName,
    getItemSearchName,
    loadItem,
    loadCombo,
    getConstList,
    makeCode,
    updateComboInMemory,
    addComboToMemory,
    deleteComboFromMemory,
  };
};

const globalModel = useAppModel();
export function useGlobals() {
  return globalModel;
}
