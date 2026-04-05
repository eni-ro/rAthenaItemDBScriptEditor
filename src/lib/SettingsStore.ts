import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';

export interface LeftPaneHeights {
  top: number;
  mid: number;
  bot: number;
}

export interface WindowState {
  width: number;
  height: number;
  isMaximized: boolean;
}

export interface AppSettings {
  leftWidth: number;
  leftPaneHeights: LeftPaneHeights;
  windowState?: WindowState;
}

export class SettingsStore {
  private static instance: SettingsStore;
  private settings: AppSettings = {
    leftWidth: 40,
    leftPaneHeights: {
      top: 50,
      mid: 25,
      bot: 25
    },
    windowState: {
      width: 1000,
      height: 800,
      isMaximized: false
    }
  };
  private settingsPath: string | null = null;

  private constructor() {}

  public static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  // Simple path joiner for settings (works for Windows/Unix when using tauri-plugin-fs)
  private join(dir: string, file: string): string {
    const sep = dir.includes('\\') ? '\\' : '/';
    return dir.endsWith(sep) ? dir + file : dir + sep + file;
  }

  async load(): Promise<AppSettings> {
    try {
      const exeDir = await invoke<string>('get_exe_dir');
      this.settingsPath = this.join(exeDir, 'setting.json');

      if (await exists(this.settingsPath)) {
        const content = await readTextFile(this.settingsPath);
        const parsed = JSON.parse(content);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return this.settings;
  }

  async save(): Promise<void> {
    if (!this.settingsPath) {
      const exeDir = await invoke<string>('get_exe_dir');
      this.settingsPath = this.join(exeDir, 'setting.json');
    }

    try {
      await writeTextFile(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  get data(): AppSettings {
    return this.settings;
  }

  set leftWidth(val: number) {
    this.settings.leftWidth = val;
  }

  set leftPaneHeights(val: LeftPaneHeights) {
    this.settings.leftPaneHeights = val;
  }
  
  async getBasePath(): Promise<string> {
    const exeDir = await invoke<string>('get_exe_dir');
    // Ensure it ends with a separator
    const sep = exeDir.includes('\\') ? '\\' : '/';
    return exeDir.endsWith(sep) ? exeDir : exeDir + sep;
  }
}

export const settings = SettingsStore.getInstance();
