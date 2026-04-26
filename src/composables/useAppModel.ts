import { ref, shallowRef } from 'vue';
import { ScriptConfReader, ScriptCategoryConf, ScriptItemConf, ConstListConf } from '../lib/ScriptConfReader';
import { DbReader, ItemDbEntry, ComboDbEntry } from '../lib/DbReader';

const useAppModel = () => {
  const scriptReader = new ScriptConfReader();
  const dbReader = new DbReader();

  const isLoaded = ref(false);
  const categories = shallowRef<ScriptCategoryConf[]>([]);
  const consts = shallowRef<ConstListConf[]>([]);

  const currentItem = ref<ItemDbEntry | null>(null);
  const currentCombo = ref<ComboDbEntry | null>(null);
  const mainTab = ref<'items' | 'combos'>('items');
  const dbYmlPath = ref<string>('');

  async function loadData(scriptPath: string, constPath: string, dbPath: string) {
    dbYmlPath.value = dbPath;
    await scriptReader.load(scriptPath, constPath);
    categories.value = scriptReader.scripts;
    consts.value = scriptReader.consts;
    await dbReader.load(dbPath);
    isLoaded.value = true;
  }

  function getItems() { return dbReader.items; }
  function getSkills() { return dbReader.skills; }
  function getMobs() { return dbReader.mobs; }
  function getCombos() { return dbReader.combos; }
  function getItemNames() { return dbReader.itemNames; }
  function getEncoding() { return dbReader.encoding; }

  function getDisplayName(item: ItemDbEntry): string {
    return dbReader.getDisplayName(item);
  }

  function getItemSearchName(aegis_name: string): string {
    const item = dbReader.getItem(aegis_name);
    if (!item) return aegis_name;
    return dbReader.getDisplayName(item);
  }

  function loadItem(aegis_name: string) {
    const item = dbReader.getItem(aegis_name);
    if (item) {
      currentItem.value = { ...item };
      mainTab.value = 'items';
    }
  }

  function loadCombo(combo: ComboDbEntry) {
    currentCombo.value = {
      ...combo,
      combos: combo.combos.map(c => ({ ...c, items: [...c.items] })),
    };
    mainTab.value = 'combos';
  }

  function getConstList(name: string) { return scriptReader.getConstList(name); }
  function makeCode(script: ScriptItemConf, args: string[]) { return scriptReader.makeCode(script, args); }

  function updateComboInMemory(combo: ComboDbEntry) {
    const idx = dbReader.combos.findIndex(c => c.filePath === combo.filePath && c.index === combo.index);
    if (idx >= 0) dbReader.combos[idx] = combo;
    else dbReader.combos.push(combo);
  }

  function addComboToMemory(combo: ComboDbEntry) { dbReader.combos.push(combo); }

  function deleteComboFromMemory(filePath: string, index: number) {
    const idx = dbReader.combos.findIndex(c => c.filePath === filePath && c.index === index);
    if (idx >= 0) {
      dbReader.combos.splice(idx, 1);
      dbReader.combos.forEach(c => {
        if (c.filePath === filePath && c.index > index) c.index -= 1;
      });
    }
  }

  return {
    isLoaded, categories, consts,
    currentItem, currentCombo, mainTab, dbYmlPath,
    loadData, getItems, getSkills, getMobs, getCombos,
    getItemNames, getEncoding, getDisplayName, getItemSearchName,
    loadItem, loadCombo, getConstList, makeCode,
    updateComboInMemory, addComboToMemory, deleteComboFromMemory,
  };
};

const globalModel = useAppModel();
export function useGlobals() { return globalModel; }
