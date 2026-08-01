import express from 'express';
import cors from 'cors';
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
