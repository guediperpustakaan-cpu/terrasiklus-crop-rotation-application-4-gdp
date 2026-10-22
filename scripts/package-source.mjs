import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputName = "terrasiklus-source.zip";
const outputPath = join(root, "public", outputName);

const rootFiles = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "drizzle.config.ts",
  ".env.example",
  ".gitignore",
  "LICENSE",
  "README.md",
];
const rootFolders = ["src", "public", "scripts", "drizzle"];
const skippedFolders = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  "artifacts",
  ".turbo",
]);
const skippedFiles = new Set([outputName, "tsconfig.tsbuildinfo", ".DS_Store"]);

const isSecret = (name) =>
  name === ".env" || (name.startsWith(".env.") && name !== ".env.example");

function collect(folder, entries) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (item.isDirectory()) {
      if (skippedFolders.has(item.name)) continue;
      collect(join(folder, item.name), entries);
      continue;
    }
    if (!item.isFile()) continue;
    if (skippedFiles.has(item.name) || isSecret(item.name)) continue;
    const full = join(folder, item.name);
    entries.push({
      name: relative(root, full).split(sep).join("/"),
      data: readFileSync(full),
      date: statSync(full).mtime,
    });
  }
}

function dosTimestamp(date) {
  return {
    time:
      ((date.getHours() & 0x1f) << 11) |
      ((date.getMinutes() & 0x3f) << 5) |
      ((date.getSeconds() >> 1) & 0x1f),
    date:
      (((date.getFullYear() - 1980) & 0x7f) << 9) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      (date.getDate() & 0x1f),
  };
}

// Minimal store-only ZIP writer: no third-party dependency, so the archive can
// be produced on any machine that can run the project scripts.
function buildZip(entries) {
  const body = [];
  const directory = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const deflated = deflateRawSync(entry.data, { level: 9 });
    const stored = deflated.length >= entry.data.length;
    const payload = stored ? entry.data : deflated;
    const method = stored ? 0 : 8;
    const checksum = crc32(entry.data);
    const { time, date } = dosTimestamp(entry.date);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    body.push(local, name, payload);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(method, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(date, 14);
    header.writeUInt32LE(checksum, 16);
    header.writeUInt32LE(payload.length, 20);
    header.writeUInt32LE(entry.data.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    header.writeUInt32LE(offset, 42);
    directory.push(header, name);

    offset += local.length + name.length + payload.length;
  }
  const central = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...body, central, end]);
}

const entries = [];
for (const name of rootFiles) {
  try {
    const full = join(root, name);
    entries.push({
      name,
      data: readFileSync(full),
      date: statSync(full).mtime,
    });
  } catch {
    console.warn(`package-source: melewati ${name} (tidak ditemukan)`);
  }
}
for (const folder of rootFolders) {
  try {
    collect(join(root, folder), entries);
  } catch {
    console.warn(`package-source: melewati ${folder}/ (tidak ditemukan)`);
  }
}
entries.sort((a, b) => a.name.localeCompare(b.name));

const archive = buildZip(entries);
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(outputPath, archive);
console.log(
  `package-source: ${entries.length} berkas -> public/${outputName} (${(
    archive.length / 1024
  ).toFixed(1)} KB)`,
);
