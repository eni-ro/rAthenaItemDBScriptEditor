import { readFileSync } from 'fs';
import { parse } from 'yaml';

try {
  const dbRaw = readFileSync('e:/ROEmu/rAthenaItemDBScriptEditor2/sample/input/db.yml', 'utf-8');
  const dbConf = parse(dbRaw);
  console.log("dbConf.Item:", dbConf.Item);

  let items = [];
  if (dbConf.Item) {
    for (const filePath of dbConf.Item) {
      console.log("Reading:", filePath);
      const raw = readFileSync(filePath, 'utf-8');
      const parsed = parse(raw);
      if (parsed && parsed.Body) {
        for (const item of parsed.Body) {
          if (item.Id && item.Name) {
            items.push({
              aegis_name: item.aegis_name.toString(),
              name: item.Name.toString(),
              filePath,
              script: item.Script || '',
            });
          }
        }
      }
    }
  }
  console.log(`Loaded ${items.length} items`);
  console.log(items[0]);
} catch (e) {
  console.error(e);
}
