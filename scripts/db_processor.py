"""
db_processor.py - rAthena Item DB YAML バックエンド
ruamel.yaml を使用してコメント・改行・順序を100%維持したまま YAML を編集する
Tauri Sidecar として呼び出される: 標準入力から JSON を受け取り、標準出力に JSON を返す
"""
import sys
import json
import shutil
import os
import contextlib
from pathlib import Path

try:
    from ruamel.yaml import YAML
    from ruamel.yaml.scalarstring import LiteralScalarString
    from ruamel.yaml.comments import CommentedMap, CommentedSeq
except ImportError:
    print(json.dumps({"success": False, "error": "ruamel.yaml is not installed"}))
    sys.exit(1)

# ─── rAthena item_db の推奨キー順序 ─────────────────────────────────────────
ITEM_KEY_ORDER = [
    "Id", "AegisName", "Name", "Type", "SubType",
    "Buy", "Sell", "Weight",
    "Attack", "MagicAttack", "Defense", "Range",
    "Slots", "Jobs", "Classes", "Gender", "Locations",
    "WeaponLevel", "ArmorLevel", "EquipLevelMin", "EquipLevelMax",
    "Refineable", "Gradable", "View", "AliasName",
    "Flags", "Delay", "Stack", "NoUse", "Trade",
    "Script", "EquipScript", "UnEquipScript",
]


def make_yaml():
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=4, offset=2)
    yaml.width = 4096
    yaml.allow_duplicate_keys = True  # 既存YAMLファイルに重複キーがある場合も許容
    return yaml


@contextlib.contextmanager
def backup_context(path: str):
    bak = path + ".bak"
    has_backup = False
    if os.path.exists(path):
        shutil.copy2(path, bak)
        has_backup = True
    try:
        yield
        # 成功時はバックアップを削除
        if has_backup and os.path.exists(bak):
            os.remove(bak)
    except Exception:
        # 失敗時はバックアップから復元
        if has_backup and os.path.exists(bak):
            if os.path.exists(path):
                os.remove(path)
            os.rename(bak, path)
        elif not has_backup and os.path.exists(path):
            # 新規作成に失敗した場合は作成途中のファイルを削除
            os.remove(path)
        raise





def load_yaml(yaml: YAML, path: str, encoding: str = "utf-8"):
    yaml.encoding = encoding
    with open(path, "r", encoding=encoding, errors="replace") as f:
        return yaml.load(f)


def save_yaml(yaml: YAML, path: str, data, encoding: str = "utf-8"):
    yaml.encoding = encoding
    # Use newline="\n" to keep Unix-style line endings often used in rAthena
    with open(path, "w", encoding=encoding, newline="\n") as f:
        yaml.dump(data, f)


# ─── キー順序の正規化 ──────────────────────────────────────────────────────

def reorder_item_keys(item: CommentedMap) -> CommentedMap:
    """ITEM_KEY_ORDER に従ってキーを並べ替える。未知のキーは末尾に追加。"""
    known = {k: v for k, v in item.items() if k in ITEM_KEY_ORDER}
    unknown = {k: v for k, v in item.items() if k not in ITEM_KEY_ORDER}

    new_item = CommentedMap()
    for k in ITEM_KEY_ORDER:
        if k in known:
            new_item[k] = known[k]
    for k, v in unknown.items():
        new_item[k] = v
    return new_item


# ─────────────────────────────────────────────────────────────────────────────
# アイテム更新
# ─────────────────────────────────────────────────────────────────────────────

def to_literal(s: str) -> LiteralScalarString:
    """スクリプト文字列を YAML literal block scalar に変換"""
    if s and not s.endswith("\n"):
        s = s + "\n"
    return LiteralScalarString(s)


def update_item(file_path: str, aegis_name: str, item_data: dict, encoding: str = "utf-8") -> dict:
    with backup_context(file_path):
        yaml = make_yaml()
        doc = load_yaml(yaml, file_path, encoding)

        if not doc or "Body" not in doc:
            return {"success": False, "error": "Invalid YAML: Body not found"}

        target = None
        for item in doc["Body"]:
            if str(item.get("AegisName", "")) == str(aegis_name):
                target = item
                break

        if target is None:
            return {"success": False, "error": f"Item '{aegis_name}' not found in {file_path}"}

        apply_item_data(target, item_data)

        save_yaml(yaml, file_path, doc, encoding)
        return {"success": True}


def apply_item_data(target: CommentedMap, item_data: dict):
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
            # ID, AegisName, Name, Type は必須フィールドとして扱い、空なら削除しない(バリデーション等は呼び出し側)
            # それ以外のフィールドは None または "" の場合に YAML から削除する
            should_omit = (val is None or val == "")
            if should_omit:
                if field in target and field not in ("Id", "AegisName", "Name", "Type"):
                    del target[field]
            else:
                target[field] = val

    # ─── Jobs / Classes / Locations ───────────────────────────────────────
    for map_field in ["Jobs", "Classes", "Locations"]:
        if map_field in item_data:
            val = item_data[map_field]  # list of string keys, or None
            item_type = item_data.get("Type", target.get("Type", "Etc"))
            if not val:
                if item_type in ("Weapon", "Armor"):
                    m = CommentedMap()
                    m["All"] = True
                    target[map_field] = m
                else:
                    if map_field in target:
                        del target[map_field]
            else:
                m = CommentedMap()
                for key in val:
                    m[key] = True
                target[map_field] = m

    # ─── Flags ──────────────────────────────────────────────────────────
    if "Flags" in item_data:
        flags = item_data["Flags"]
        if not flags or all(not v for v in flags.values()):
            if "Flags" in target:
                del target["Flags"]
        else:
            m = CommentedMap()
            for k, v in flags.items():
                if v:
                    m[k] = v
            target["Flags"] = m

    # ─── Delay ──────────────────────────────────────────────────────────
    if "Delay" in item_data:
        delay = item_data["Delay"]
        if not delay or (not delay.get("Duration") and not delay.get("Status")):
            if "Delay" in target:
                del target["Delay"]
        else:
            m = CommentedMap()
            if delay.get("Duration"):
                m["Duration"] = delay["Duration"]
            if delay.get("Status"):
                m["Status"] = delay["Status"]
            target["Delay"] = m

    # ─── Stack ──────────────────────────────────────────────────────────
    if "Stack" in item_data:
        stack = item_data["Stack"]
        if not stack or not stack.get("Amount"):
            if "Stack" in target:
                del target["Stack"]
        else:
            m = CommentedMap()
            m["Amount"] = stack["Amount"]
            for k in ["Inventory", "Cart", "Storage", "GuildStorage"]:
                if stack.get(k):
                    m[k] = True
            target["Stack"] = m

    # ─── NoUse ──────────────────────────────────────────────────────────
    if "NoUse" in item_data:
        nouse = item_data["NoUse"]
        if not nouse or not nouse.get("Sitting"):
            if "NoUse" in target:
                del target["NoUse"]
        else:
            m = CommentedMap()
            if nouse.get("Override") and nouse["Override"] != 100:
                m["Override"] = nouse["Override"]
            m["Sitting"] = True
            target["NoUse"] = m

    # ─── Trade ──────────────────────────────────────────────────────────
    if "Trade" in item_data:
        trade = item_data["Trade"]
        trade_bool_keys = ["NoDrop", "NoTrade", "TradePartner", "NoSell", "NoCart",
                           "NoStorage", "NoGuildStorage", "NoMail", "NoAuction"]
        if not trade or all(not trade.get(k) for k in trade_bool_keys):
            if "Trade" in target:
                del target["Trade"]
        else:
            m = CommentedMap()
            if trade.get("Override") and trade["Override"] != 100:
                m["Override"] = trade["Override"]
            for k in trade_bool_keys:
                if trade.get(k):
                    m[k] = True
            target["Trade"] = m

    # ─── Script fields ─────────────────────────────────────────────────
    for sf in ["Script", "EquipScript", "UnEquipScript"]:
        if sf in item_data:
            val = item_data[sf]
            if not val or not val.strip():
                if sf in target:
                    del target[sf]
            else:
                target[sf] = to_literal(val)

    # ─── キー順序を正規化 ──────────────────────────────────────────────
    reordered = reorder_item_keys(target)
    # target の内容を reordered に置き換え
    for k in list(target.keys()):
        del target[k]
    for k, v in reordered.items():
        target[k] = v

def add_item(file_path: str, item_data: dict, encoding: str = "utf-8") -> dict:
    with backup_context(file_path):
        yaml = make_yaml()
        doc = load_yaml(yaml, file_path, encoding)

        if not doc or "Body" not in doc:
            return {"success": False, "error": "Invalid YAML: Body not found"}

        target = CommentedMap()
        apply_item_data(target, item_data)
        
        doc["Body"].append(target)
        new_index = len(doc["Body"]) - 1

        save_yaml(yaml, file_path, doc, encoding)
        return {"success": True, "index": new_index}

def delete_item(file_path: str, aegis_name: str, encoding: str = "utf-8") -> dict:
    with backup_context(file_path):
        yaml = make_yaml()
        doc = load_yaml(yaml, file_path, encoding)

        if not doc or "Body" not in doc:
            return {"success": False, "error": "Invalid YAML: Body not found"}

        target_idx = None
        for i, item in enumerate(doc["Body"]):
            if str(item.get("AegisName", "")) == str(aegis_name):
                target_idx = i
                break

        if target_idx is None:
            return {"success": False, "error": f"Item '{aegis_name}' not found in {file_path}"}

        del doc["Body"][target_idx]

        save_yaml(yaml, file_path, doc, encoding)
        return {"success": True}

# ─────────────────────────────────────────────────────────────────────────────
# コンボ更新
# ─────────────────────────────────────────────────────────────────────────────

def update_combo(file_path: str, combo_index: int, combo_data: dict, encoding: str = "utf-8") -> dict:
    with backup_context(file_path):
        yaml = make_yaml()
        doc = load_yaml(yaml, file_path, encoding)

        if not doc or "Body" not in doc:
            return {"success": False, "error": "Invalid YAML: Body not found"}

        body = doc.get("Body", [])
        if combo_index < 0 or combo_index >= len(body):
            return {"success": False, "error": f"Combo index {combo_index} not found"}

        entry = body[combo_index]

        if "combos" in combo_data:
            combos_seq = CommentedSeq()
            for combo_items in combo_data["combos"]:
                combo_map = CommentedMap()
                items_seq = CommentedSeq()
                for aegis in combo_items:
                    items_seq.append(aegis)
                combo_map["Combo"] = items_seq
                combos_seq.append(combo_map)
            entry["Combos"] = combos_seq

        if "script" in combo_data:
            val = combo_data["script"]
            if not val or not val.strip():
                if "Script" in entry:
                    del entry["Script"]
            else:
                entry["Script"] = to_literal(val)

        save_yaml(yaml, file_path, doc, encoding)
        return {"success": True}


def add_combo(file_path: str, combo_data: dict, encoding: str = "utf-8") -> dict:
    with backup_context(file_path):
        yaml = make_yaml()
        doc = load_yaml(yaml, file_path, encoding)

        if not doc or "Body" not in doc:
            return {"success": False, "error": "Invalid YAML: Body not found"}

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

        save_yaml(yaml, file_path, doc, encoding)
        return {"success": True, "index": new_index}


def delete_combo(file_path: str, combo_index: int, encoding: str = "utf-8") -> dict:
    with backup_context(file_path):
        yaml = make_yaml()
        doc = load_yaml(yaml, file_path, encoding)

        if not doc or "Body" not in doc:
            return {"success": False, "error": "Invalid YAML: Body not found"}

        body = doc["Body"]
        if combo_index < 0 or combo_index >= len(body):
            return {"success": False, "error": f"Combo index {combo_index} out of range"}

        del body[combo_index]
        save_yaml(yaml, file_path, doc, encoding)
        return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# db.yml 更新
# ─────────────────────────────────────────────────────────────────────────────

def update_db_yml(file_path: str, db_config: dict) -> dict:
    """db.yml は常に UTF-8"""
    with backup_context(file_path):
        yaml = make_yaml()

        if os.path.exists(file_path):
            doc = load_yaml(yaml, file_path, "utf-8")
        else:
            doc = {}

        if doc is None:
            doc = {}

        for key, val in db_config.items():
            if val is not None:
                doc[key] = val

        save_yaml(yaml, file_path, doc, "utf-8")
        return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# メインエントリポイント
# ─────────────────────────────────────────────────────────────────────────────

def main():
    try:
        # On Windows, stdin might be opened with CP932. 
        # Read as binary and decode as UTF-8 to be safe.
        raw_bytes = sys.stdin.buffer.read()
        if not raw_bytes:
            return
        request = json.loads(raw_bytes.decode("utf-8"))
    except Exception as e:
        res = {"success": False, "error": f"Failed to parse input: {e}"}
        sys.stdout.buffer.write(json.dumps(res).encode("utf-8"))
        sys.exit(1)

    action = request.get("action")
    encoding = request.get("encoding", "utf-8")

    try:
        if action == "update_item":
            result = update_item(
                request["file"],
                request["aegis_name"],
                request["data"],
                encoding,
            )
        elif action == "add_item":
            result = add_item(
                request["file"],
                request["data"],
                encoding,
            )
        elif action == "delete_item":
            result = delete_item(
                request["file"],
                request["aegis_name"],
                encoding,
            )
        elif action == "update_combo":
            result = update_combo(
                request["file"],
                request["combo_index"],
                request["data"],
                encoding,
            )
        elif action == "add_combo":
            result = add_combo(
                request["file"],
                request["data"],
                encoding,
            )
        elif action == "delete_combo":
            result = delete_combo(
                request["file"],
                request["combo_index"],
                encoding,
            )
        elif action == "update_db_yml":
            result = update_db_yml(
                request["file"],
                request["data"],
            )
        else:
            result = {"success": False, "error": f"Unknown action: {action}"}
    except Exception as e:
        import traceback
        result = {"success": False, "error": str(e), "traceback": traceback.format_exc()}

    # Use binary stdout to avoid encoding issues on Windows console
    sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))


if __name__ == "__main__":
    main()
