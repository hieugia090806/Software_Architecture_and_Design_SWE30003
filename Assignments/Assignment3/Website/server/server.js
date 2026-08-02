import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAll, getById, insert, update, remove } from './src/services/filePersistence.js';
import { 
    getEnrichedTrips, 
    getEnrichedInvoices, 
    getEnrichedCustomers, 
    getEnrichedDrivers 
} from './src/services/relationalResolver.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* -------------------- Auto Database Initialization -------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../database/data');

// Added vehicle_types and pending_approvals to ensure standard GET endpoints return [] instead of throwing file errors
const REQUIRED_TABLES = [
    'users',
    'branches',
    'vehicles',
    'vehicle_types',
    'drivers',
    'customers',
    'orders',
    'trips',
    'invoices',
    'maintenance_records',
    'tracking_telemetry',
    'trip_incidents',
    'pending_approvals'
];

function initDatabase() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    REQUIRED_TABLES.forEach((table) => {
        const filePath = path.join(DATA_DIR, `${table}.json`);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
            console.log(`[Auto-Init] Created missing database file: ${table}.json`);
        }
    });
}

initDatabase();

/* -------------------- Enriched Endpoints -------------------- */
app.get('/api/enriched/trips', (req, res) => {
    try {
        res.json(getEnrichedTrips());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/enriched/invoices', (req, res) => {
    try {
        res.json(getEnrichedInvoices());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/enriched/customers', (req, res) => {
    try {
        res.json(getEnrichedCustomers());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/enriched/drivers', (req, res) => {
    try {
        res.json(getEnrichedDrivers());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- Generic REST API -------------------- */
app.get('/api/:table', (req, res) => {
    try {
        const data = getAll(req.params.table);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/:table/:id', (req, res) => {
    try {
        const item = getById(req.params.table, req.params.id);
        if (!item) return res.status(404).json({ error: 'Record not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/:table', (req, res) => {
    try {
        const newItem = insert(req.params.table, req.body);
        res.status(201).json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/:table/:id', (req, res) => {
    try {
        const updated = update(req.params.table, req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: 'Record not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/:table/:id', (req, res) => {
    try {
        const success = remove(req.params.table, req.params.id);
        if (!success) return res.status(404).json({ error: 'Record not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- Server Startup -------------------- */
app.listen(PORT, () => {
    console.log(`SmartFM Server running on port ${PORT} using file-based persistence.`);
});