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
  const items = shallowRef<ItemDbEntry[]>([]);
  const combos = shallowRef<ComboDbEntry[]>([]);
  const mainTab = ref<'items' | 'combos'>('items');
  const dbYmlPath = ref<string>('');

  async function loadData(scriptPath: string, constPath: string, dbPath: string) {
    dbYmlPath.value = dbPath;
    await scriptReader.load(scriptPath, constPath);
    categories.value = scriptReader.scripts;
    consts.value = scriptReader.consts;
    await dbReader.load(dbPath);
    items.value = [...dbReader.items];
    combos.value = [...dbReader.combos];
    isLoaded.value = true;
  }

  function getItems() { return items.value; }
  function getSkills() { return dbReader.skills; }
  function getMobs() { return dbReader.mobs; }
  function getCombos() { return combos.value; }
  function getItemNames() { return dbReader.itemNames; }
  function getItemFiles() { return dbReader.itemFiles; }
  function getComboFiles() { return dbReader.comboFiles; }
  function getEncoding() { return dbReader.encoding; }
  function getRustEncoding() { return dbReader.rustEncoding; }
  function getPythonEncoding() { return dbReader.pythonEncoding; }
  function getSortOnInsert() { return dbReader.sortOnInsert; }
  function getSortOnUpdate() { return dbReader.sortOnUpdate; }
  function getDivinePrideKey() { return dbReader.divinePrideKey; }
  function getEnableFuzzyDivinePride() { return dbReader.enableFuzzyDivinePride; }
  function getDivinePrideRangeSource() { return dbReader.divinePrideRangeSource; }
  function getShowComboComments() { return dbReader.showComboComments; }

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

  function updateItemInMemory(item: ItemDbEntry, oldAegisName: string) {
    const idx = items.value.findIndex(i => i.filePath === item.filePath && i.aegis_name === oldAegisName);
    if (idx >= 0) {
      const newItems = [...items.value];
      newItems[idx] = { ...item };
      
      // Re-sort if sortOnUpdate is enabled
      if (dbReader.sortOnUpdate) {
        newItems.sort((a, b) => a.id - b.id);
      }
      
      items.value = newItems;
      dbReader.items = newItems; // sync with reader
    }
  }

  function addItemToMemory(item: ItemDbEntry) {
    const newItems = [...items.value, { ...item }];
    
    // Re-sort if sortOnInsert is enabled
    if (dbReader.sortOnInsert) {
      newItems.sort((a, b) => a.id - b.id);
    }
    
    items.value = newItems;
    dbReader.items = newItems;
  }

  function deleteItemFromMemory(filePath: string, aegis_name: string) {
    const newItems = items.value.filter(i => !(i.filePath === filePath && i.aegis_name === aegis_name));
    items.value = newItems;
    dbReader.items = newItems;
  }

  function updateComboInMemory(combo: ComboDbEntry) {
    const idx = combos.value.findIndex(c => c.filePath === combo.filePath && c.index === combo.index);
    const newCombos = [...combos.value];
    if (idx >= 0) newCombos[idx] = { ...combo };
    else newCombos.push({ ...combo });
    combos.value = newCombos;
    dbReader.combos = newCombos;
  }

  function addComboToMemory(combo: ComboDbEntry) {
    const newCombos = [...combos.value, { ...combo }];
    combos.value = newCombos;
    dbReader.combos = newCombos;
  }

  function deleteComboFromMemory(filePath: string, index: number) {
    const idx = combos.value.findIndex(c => c.filePath === filePath && c.index === index);
    if (idx >= 0) {
      const newCombos = combos.value.filter((_, i) => i !== idx);
      newCombos.forEach(c => {
        if (c.filePath === filePath && c.index > index) c.index -= 1;
      });
      combos.value = newCombos;
      dbReader.combos = newCombos;
    }
  }

  return {
    isLoaded, categories, consts,
    currentItem, currentCombo, mainTab, dbYmlPath,
    loadData, getItems, getSkills, getMobs, getCombos,
    getItemNames, getItemFiles, getComboFiles, getEncoding, getRustEncoding, getPythonEncoding,
    getSortOnInsert, getSortOnUpdate, getDivinePrideKey, getEnableFuzzyDivinePride, getDivinePrideRangeSource, getShowComboComments, getDisplayName, getItemSearchName,
    loadItem, loadCombo, getConstList, makeCode,
    updateItemInMemory, addItemToMemory, deleteItemFromMemory,
    updateComboInMemory, addComboToMemory, deleteComboFromMemory,
    refreshSettings() { dbReader.load(dbYmlPath.value); }
  };
};

const globalModel = useAppModel();
export function useGlobals() { return globalModel; }
