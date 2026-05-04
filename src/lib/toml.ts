type TomlValue = string | number | boolean | TomlTable;
type TomlTable = { [key: string]: TomlValue };

function parseKeyPath(path: string): string[] {
  const keys: string[] = [];
  let i = 0;
  while (i < path.length) {
    while (i < path.length && path[i] === " ") i++;
    if (i >= path.length) break;

    if (path[i] === '"') {
      i++;
      let key = "";
      while (i < path.length && path[i] !== '"') {
        if (path[i] === "\\" && i + 1 < path.length) {
          i++;
          if (path[i] === "n") key += "\n";
          else if (path[i] === "t") key += "\t";
          else key += path[i];
        } else {
          key += path[i];
        }
        i++;
      }
      i++; // skip closing quote
      keys.push(key);
    } else {
      let key = "";
      while (i < path.length && path[i] !== ".") {
        key += path[i];
        i++;
      }
      keys.push(key.trim());
    }

    while (i < path.length && path[i] === " ") i++;
    if (i < path.length && path[i] === ".") i++;
  }
  return keys;
}

function parseValue(raw: string): TomlValue {
  if (raw === "true") return true;
  if (raw === "false") return false;

  if (raw.startsWith('"')) {
    let result = "";
    let i = 1;
    while (i < raw.length && raw[i] !== '"') {
      if (raw[i] === "\\" && i + 1 < raw.length) {
        i++;
        if (raw[i] === "n") result += "\n";
        else if (raw[i] === "t") result += "\t";
        else result += raw[i];
      } else {
        result += raw[i];
      }
      i++;
    }
    return result;
  }

  const num = Number(raw);
  if (!Number.isNaN(num) && raw !== "") return num;

  return raw;
}

function ensureTable(root: TomlTable, keys: string[]): TomlTable {
  let current = root;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as TomlTable;
  }
  return current;
}

export function parseToml(input: string): TomlTable {
  const root: TomlTable = {};
  let current = root;

  for (const raw of input.split(/\r?\n/)) {
    const commentIdx = findCommentStart(raw);
    const line = (commentIdx >= 0 ? raw.slice(0, commentIdx) : raw).trim();
    if (!line) continue;

    const headerMatch = line.match(/^\[(.+)\]$/);
    if (headerMatch) {
      current = ensureTable(root, parseKeyPath(headerMatch[1]));
      continue;
    }

    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const keyPart = line.slice(0, eqIdx).trim();
    const valuePart = line.slice(eqIdx + 1).trim();
    const key = keyPart.startsWith('"')
      ? parseValue(keyPart) as string
      : keyPart;
    current[key] = parseValue(valuePart);
  }

  return root;
}

function findCommentStart(line: string): number {
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"' && (i === 0 || line[i - 1] !== "\\")) {
      inString = !inString;
    } else if (line[i] === "#" && !inString) {
      return i;
    }
  }
  return -1;
}
