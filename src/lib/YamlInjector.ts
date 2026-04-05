import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

export class YamlInjector {
  constructor(private file: string) { }

  async injectScript(aegis_name: number | string, script: string[]): Promise<boolean> {
    let rawContent = await readTextFile(this.file);
    const { header, item, footer } = this.extractItem(rawContent, aegis_name);
    if (!item) {
      return false;
    }

    let modifiedItem = this.deleteScript(item);
    const yamlScripts = this.decorateToYamlFormat(script);

    // Some items might not have a newline at the end if it's the last item
    if (modifiedItem && !modifiedItem.endsWith('\n')) {
      modifiedItem += '\n';
    }

    const newContent = header + modifiedItem + yamlScripts + footer;
    await writeTextFile(this.file, newContent);
    return true;
  }

  private extractItem(str: string, aegis_name: number | string): { header: string, item: string | null, footer: string } {
    const idIndex = str.search(new RegExp(`^    AegisName: ${aegis_name} *?(#.*)?$`, 'm'));
    if (idIndex === -1) {
      return { header: str, item: null, footer: '' };
    }

    const startPos = str.lastIndexOf('    AegisName:', idIndex);
    if (startPos === -1) {
      return { header: str, item: null, footer: '' };
    }

    // search for the next item start, skipping the current startPos point
    const nextItemMatchRegExp = new RegExp(`^  - `, 'mg');
    nextItemMatchRegExp.lastIndex = idIndex + 1;
    const match = nextItemMatchRegExp.exec(str);

    const endPos = match ? match.index : str.length;

    const header = str.substring(0, startPos);
    const item = str.substring(startPos, endPos);
    const footer = str.substring(endPos);

    return { header, item, footer };
  }

  private deleteScript(itemStr: string): string {
    let str = this.deleteScriptSub(itemStr, /^    Script:/m);
    str = this.deleteScriptSub(str, /^    EquipScript:/m);
    str = this.deleteScriptSub(str, /^    UnEquipScript:/m);
    return str;
  }

  private deleteScriptSub(str: string, markRegExp: RegExp): string {
    const match = str.match(markRegExp);
    if (!match || match.index === undefined) {
      return str;
    }

    const startPos = match.index;
    const header = str.substring(0, startPos);

    // Look for the next element at the same indent level or higher (meaning fewer spaces)
    // The ruby code looked for `^    [^ ]` which means exactly 4 spaces then non-space.
    // We should be careful to skip the current line.
    const searchArea = str.substring(startPos + match[0].length);
    const endMatch = searchArea.match(/^    [^ ]/m);

    if (!endMatch || endMatch.index === undefined) {
      // Reached the end of the item block
      return header;
    }

    // The distance to the next block
    const endPos = startPos + match[0].length + endMatch.index;
    return header + str.substring(endPos);
  }

  private decorateToYamlFormat(scripts: string[]): string {
    let str = "";
    if (scripts[0] && scripts[0].trim().length > 0) {
      str += "    Script: |\n      " + scripts[0].replace(/\n/g, "\n      ").replace(/\t/g, "  ").trimRight() + "\n";
    }
    if (scripts[1] && scripts[1].trim().length > 0) {
      str += "    EquipScript: |\n      " + scripts[1].replace(/\n/g, "\n      ").replace(/\t/g, "  ").trimRight() + "\n";
    }
    if (scripts[2] && scripts[2].trim().length > 0) {
      str += "    UnEquipScript: |\n      " + scripts[2].replace(/\n/g, "\n      ").replace(/\t/g, "  ").trimRight() + "\n";
    }
    return str;
  }
}
