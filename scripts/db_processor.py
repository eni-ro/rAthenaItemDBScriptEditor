"""
db_processor.py - rAthena Item DB YAML バックエンド
ruamel.yaml を使用してコメント・改行・順序を100%維持したまま YAML を編集する
Tauri Sidecar として呼び出される: 標準入力から JSON を受け取り、標準出力に JSON を返す
"""
import sys
import json
import shutil
import os
from pathlib import Path

try:
    from ruamel.yaml import YAML
    from ruamel.yaml.scalarstring import LiteralScalarString
except ImportError:
    print(json.dumps({"success": False, "error": "ruamel.yaml is not installed"}))
    sys.exit(1)


def make_yaml():
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=4, offset=2)
    yaml.width = 4096
    return yaml


def backup_file(path: str):
    bak = path + ".bak"
    shutil.copy2(path, bak)


def load_yaml(yaml: YAML, path: str):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.load(f)


def save_yaml(yaml: YAML, path: str, data):
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(data, f)


# ─────────────────────────────────────────────────────────────────────────────
# アイテム更新
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_FIELDS = {"Script", "EquipScript", "UnEquipScript"}

# デフォルト値（省略可能なフィールド）
ITEM_DEFAULTS = {
    "Type": "Etc",
    "SubType": None,
    "Buy": None,  # Sell*2 が default
    "Sell": None,  # Buy/2 が default
    "Weight": 0,
    "Attack": 0,
    "MagicAttack": 0,
    "Defense": 0,
    "Range": 0,
    "Slots": 0,
    "Gender": "Both",
    "WeaponLevel": None,
    "ArmorLevel": None,
    "EquipLevelMin": 0,
    "EquipLevelMax": 0,
    "Refineable": False,
    "Gradable": False,
    "View": 0,
    "AliasName": None,
}


def to_literal(s: str) -> LiteralScalarString:
    """スクリプト文字列をYAML literal block scalar に変換"""
    if s and not s.endswith("\n"):
        s = s + "\n"
    return LiteralScalarString(s)


def update_item(file_path: str, aegis_name: str, item_data: dict) -> dict:
    """
    item_data: フロントエンドから渡されるアイテムの全フィールド (None は省略)
    """
    backup_file(file_path)
    yaml = make_yaml()
    doc = load_yaml(yaml, file_path)

    if not doc or "Body" not in doc:
        return {"success": False, "error": "Invalid YAML: Body not found"}

    target = None
    for item in doc["Body"]:
        if str(item.get("AegisName", "")) == str(aegis_name):
            target = item
            break

    if target is None:
        return {"success": False, "error": f"Item '{aegis_name}' not found in {file_path}"}

    # 単純フィールドの更新
    simple_fields = [
        "Id", "AegisName", "Name", "Type", "SubType",
        "Buy", "Sell", "Weight", "Attack", "MagicAttack",
        "Defense", "Range", "Slots", "Gender",
        "WeaponLevel", "ArmorLevel", "EquipLevelMin", "EquipLevelMax",
        "Refineable", "Gradable", "View", "AliasName",
    ]

    for field in simple_fields:
        if field in item_data:
            val = item_data[field]
            if val is None or val == "" or val == ITEM_DEFAULTS.get(field):
                if field in target:
                    del target[field]
            else:
                target[field] = val

    # Jobs / Classes / Locations (map形式)
    for map_field in ["Jobs", "Classes", "Locations"]:
        if map_field in item_data:
            val = item_data[map_field]  # list of string keys
            item_type = item_data.get("Type", target.get("Type", "Etc"))
            if not val:
                # 未選択
                if item_type in ("Weapon", "Armor"):
                    from ruamel.yaml.comments import CommentedMap
                    m = CommentedMap()
                    m["All"] = True
                    target[map_field] = m
                else:
                    if map_field in target:
                        del target[map_field]
            else:
                from ruamel.yaml.comments import CommentedMap
                m = CommentedMap()
                for key in val:
                    m[key] = True
                target[map_field] = m

    # Flags (map形式)
    if "Flags" in item_data:
        flags = item_data["Flags"]  # dict: { BuyingStore: bool, ... }
        if not flags or all(not v for v in flags.values()):
            if "Flags" in target:
                del target["Flags"]
        else:
            from ruamel.yaml.comments import CommentedMap
            m = CommentedMap()
            for k, v in flags.items():
                if v:
                    m[k] = v
            target["Flags"] = m

    # Delay
    if "Delay" in item_data:
        delay = item_data["Delay"]
        if not delay or (not delay.get("Duration") and not delay.get("Status")):
            if "Delay" in target:
                del target["Delay"]
        else:
            from ruamel.yaml.comments import CommentedMap
            m = CommentedMap()
            if delay.get("Duration"):
                m["Duration"] = delay["Duration"]
            if delay.get("Status"):
                m["Status"] = delay["Status"]
            target["Delay"] = m

    # Stack
    if "Stack" in item_data:
        stack = item_data["Stack"]
        if not stack or not stack.get("Amount"):
            if "Stack" in target:
                del target["Stack"]
        else:
            from ruamel.yaml.comments import CommentedMap
            m = CommentedMap()
            m["Amount"] = stack["Amount"]
            for k in ["Inventory", "Cart", "Storage", "GuildStorage"]:
                if stack.get(k):
                    m[k] = True
            target["Stack"] = m

    # NoUse
    if "NoUse" in item_data:
        nouse = item_data["NoUse"]
        if not nouse or not nouse.get("Sitting"):
            if "NoUse" in target:
                del target["NoUse"]
        else:
            from ruamel.yaml.comments import CommentedMap
            m = CommentedMap()
            if nouse.get("Override") and nouse["Override"] != 100:
                m["Override"] = nouse["Override"]
            m["Sitting"] = True
            target["NoUse"] = m

    # Trade
    if "Trade" in item_data:
        trade = item_data["Trade"]
        trade_bool_keys = ["NoDrop", "NoTrade", "TradePartner", "NoSell", "NoCart", "NoStorage", "NoGuildStorage", "NoMail", "NoAuction"]
        if not trade or all(not trade.get(k) for k in trade_bool_keys):
            if "Trade" in target:
                del target["Trade"]
        else:
            from ruamel.yaml.comments import CommentedMap
            m = CommentedMap()
            if trade.get("Override") and trade["Override"] != 100:
                m["Override"] = trade["Override"]
            for k in trade_bool_keys:
                if trade.get(k):
                    m[k] = True
            target["Trade"] = m

    # Script fields
    for sf in ["Script", "EquipScript", "UnEquipScript"]:
        if sf in item_data:
            val = item_data[sf]
            if not val or not val.strip():
                if sf in target:
                    del target[sf]
            else:
                target[sf] = to_literal(val)

    save_yaml(yaml, file_path, doc)
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# コンボ更新
# ─────────────────────────────────────────────────────────────────────────────

def find_combo_entry(doc, combo_index: int):
    """Body の combo_index 番目のエントリを返す"""
    body = doc.get("Body", [])
    if combo_index < 0 or combo_index >= len(body):
        return None
    return body[combo_index]


def update_combo(file_path: str, combo_index: int, combo_data: dict) -> dict:
    """
    combo_data:
      combos: [ [aegis1, aegis2, ...], [aegis3, aegis4, ...] ]  # Combos ブロック内の各 Combo
      script: str
    """
    backup_file(file_path)
    yaml = make_yaml()
    doc = load_yaml(yaml, file_path)

    if not doc or "Body" not in doc:
        return {"success": False, "error": "Invalid YAML: Body not found"}

    entry = find_combo_entry(doc, combo_index)
    if entry is None:
        return {"success": False, "error": f"Combo index {combo_index} not found"}

    # Combos を更新
    if "combos" in combo_data:
        from ruamel.yaml.comments import CommentedSeq, CommentedMap
        combos_seq = CommentedSeq()
        for combo_items in combo_data["combos"]:
            combo_map = CommentedMap()
            items_seq = CommentedSeq()
            for aegis in combo_items:
                items_seq.append(aegis)
            combo_map["Combo"] = items_seq
            combos_seq.append(combo_map)
        entry["Combos"] = combos_seq

    # Script を更新
    if "script" in combo_data:
        val = combo_data["script"]
        if not val or not val.strip():
            if "Script" in entry:
                del entry["Script"]
        else:
            entry["Script"] = to_literal(val)

    save_yaml(yaml, file_path, doc)
    return {"success": True}


def add_combo(file_path: str, combo_data: dict) -> dict:
    """
    新規 Combos ブロックを Body に追加する
    combo_data:
      combos: [ [aegis1, aegis2, ...], ... ]
      script: str
    戻り値: { success: True, index: <新規インデックス> }
    """
    backup_file(file_path)
    yaml = make_yaml()
    doc = load_yaml(yaml, file_path)

    if not doc or "Body" not in doc:
        return {"success": False, "error": "Invalid YAML: Body not found"}

    from ruamel.yaml.comments import CommentedSeq, CommentedMap

    combos_seq = CommentedSeq()
    for combo_items in combo_data.get("combos", []):
        combo_map = CommentedMap()
        items_seq = CommentedSeq()
        for aegis in combo_items:
            items_seq.append(aegis)
        combo_map["Combo"] = items_seq
        combos_seq.append(combo_map)

    new_entry = CommentedMap()
    new_entry["Combos"] = combos_seq

    script = combo_data.get("script", "")
    if script and script.strip():
        new_entry["Script"] = to_literal(script)

    doc["Body"].append(new_entry)
    new_index = len(doc["Body"]) - 1

    save_yaml(yaml, file_path, doc)
    return {"success": True, "index": new_index}


def delete_combo(file_path: str, combo_index: int) -> dict:
    """Body から combo_index 番目のエントリを削除する"""
    backup_file(file_path)
    yaml = make_yaml()
    doc = load_yaml(yaml, file_path)

    if not doc or "Body" not in doc:
        return {"success": False, "error": "Invalid YAML: Body not found"}

    body = doc["Body"]
    if combo_index < 0 or combo_index >= len(body):
        return {"success": False, "error": f"Combo index {combo_index} out of range"}

    del body[combo_index]
    save_yaml(yaml, file_path, doc)
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# db.yml 更新
# ─────────────────────────────────────────────────────────────────────────────

def update_db_yml(file_path: str, db_config: dict) -> dict:
    """
    db_config: { Item: [...], ItemCombos: [...], ItemName: [...], Mob: [...], Skill: [...] }
    """
    backup_file(file_path)
    yaml = make_yaml()

    # db.yml が存在しない場合は新規作成
    if os.path.exists(file_path):
        doc = load_yaml(yaml, file_path)
    else:
        doc = {}

    if doc is None:
        doc = {}

    for key, val in db_config.items():
        if val is not None:
            doc[key] = val

    save_yaml(yaml, file_path, doc)
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# メインエントリポイント
# ─────────────────────────────────────────────────────────────────────────────

def main():
    try:
        raw = sys.stdin.read()
        request = json.loads(raw)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to parse input: {e}"}))
        sys.exit(1)

    action = request.get("action")

    try:
        if action == "update_item":
            result = update_item(
                request["file"],
                request["aegis_name"],
                request["data"]
            )
        elif action == "update_combo":
            result = update_combo(
                request["file"],
                request["combo_index"],
                request["data"]
            )
        elif action == "add_combo":
            result = add_combo(
                request["file"],
                request["data"]
            )
        elif action == "delete_combo":
            result = delete_combo(
                request["file"],
                request["combo_index"]
            )
        elif action == "update_db_yml":
            result = update_db_yml(
                request["file"],
                request["data"]
            )
        else:
            result = {"success": False, "error": f"Unknown action: {action}"}
    except Exception as e:
        import traceback
        result = {"success": False, "error": str(e), "traceback": traceback.format_exc()}

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
