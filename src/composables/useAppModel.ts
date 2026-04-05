import { ref, shallowRef } from 'vue';
import { ScriptConfReader, ScriptCategoryConf, ScriptItemConf, ConstListConf } from '../lib/ScriptConfReader';
import { DbReader, ItemDbEntry } from '../lib/DbReader';

// Global state model
export const useAppModel = () => {
  const scriptReader = new ScriptConfReader();
  const dbReader = new DbReader();

  const isLoaded = ref(false);

  // Data items for current loaded script
  const categories = shallowRef<ScriptCategoryConf[]>([]);
  const consts = shallowRef<ConstListConf[]>([]);
  
  // Data for loaded DB item
  const currentItem = ref<ItemDbEntry | null>(null);

  async function loadData(scriptPath: string, constPath: string, dbPath: string) {
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

  function loadItem(aegis_name: string) {
    const item = dbReader.getItem(aegis_name);
    if (item) {
      currentItem.value = { ...item }; // trigger reactivity
    }
  }

  function getConstList(name: string) {
    return scriptReader.getConstList(name);
  }

  function makeCode(script: ScriptItemConf, args: string[]) {
    return scriptReader.makeCode(script, args);
  }

  return {
    isLoaded,
    categories,
    consts,
    currentItem,
    loadData,
    getItems,
    getSkills,
    getMobs,
    loadItem,
    getConstList,
    makeCode
  };
};

const globalModel = useAppModel();
export function useGlobals() {
  return globalModel;
}
