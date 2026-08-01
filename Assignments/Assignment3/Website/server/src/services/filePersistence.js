import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target directory: Website/database/data/
const DATA_DIR = path.resolve(__dirname, '../../../database/data');

// Ensure data directory exists on startup
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(table) {
    return path.join(DATA_DIR, `${table}.json`);
}

function load(table) {
    const filePath = getFilePath(table);
    if (!fs.existsSync(filePath)) {
        // Auto-initialize empty array if file does not exist yet
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${table}.json:`, err.message);
        return [];
    }
}

function save(table, data) {
    const filePath = getFilePath(table);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function getAll(table) {
    return load(table);
}

export function getById(table, id) {
    const data = load(table);
    return data.find(r => r.id === Number(id)) || null;
}

export function insert(table, record) {
    const data = load(table);
    // Auto-increment numeric ID
    const maxId = data.reduce((max, r) => (r.id > max ? r.id : max), 0);
    record.id = maxId + 1;
    data.push(record);
    save(table, data);
    return record;
}

export function update(table, id, updates) {
    const data = load(table);
    const idx = data.findIndex(r => r.id === Number(id));
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates, id: Number(id) };
    save(table, data);
    return data[idx];
}

export function remove(table, id) {
    let data = load(table);
    const initialLen = data.length;
    data = data.filter(r => r.id !== Number(id));
    if (data.length === initialLen) return false;
    save(table, data);
    return true;
}