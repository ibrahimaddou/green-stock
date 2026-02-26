import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

app.use(express.json());

// compute __dirname for ESM and ensure data path resolves to project/data
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

const assetsFilePath = path.join(__dirname, '..', 'data', 'items.json');

// Helper function to read data
const readData = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty array if file doesn't exist
        }
        throw error;
    }
};

// Helper function to write data (ensure directory exists)
const writeData = async (filePath, data) => {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Get all assets
app.get('/assets', async (req, res, next) => {
    try {
        const assets = await readData(assetsFilePath);
        res.json(assets);
    } catch (error) { next(error); }
});

// Get asset by ID
app.get('/assets/:id', async (req, res, next) => {
    try {
        const assets = await readData(assetsFilePath);
        const asset = assets.find(a => a.id.toString() === req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (error) { next(error); }
});

// Create asset
app.post('/assets', async (req, res, next) => {
    try {
        const { name, category, weight } = req.body;
        if (!name || !category || !weight || typeof weight !== 'number' || weight <= 0) {
            return res.status(400).json({ message: 'Missing or invalid fields: name, category, weight (positive number)' });
        }
        const assets = await readData(assetsFilePath);
        const newAsset = {
            id: Date.now(),
            name: name.trim(),
            category: category.trim(),
            weight,
            co2_saved: weight * 20
        };
        assets.push(newAsset);
        await writeData(assetsFilePath, assets);
        res.status(201).json(newAsset);
    } catch (error) { next(error); }
});

// Update asset
app.put('/assets/:id', async (req, res, next) => {
    try {
        const { name, category, weight } = req.body;
        if (!name || !category || !weight || typeof weight !== 'number' || weight <= 0) {
            return res.status(400).json({ message: 'Missing or invalid fields: name, category, weight (positive number)' });
        }
        const assets = await readData(assetsFilePath);
        const index = assets.findIndex(a => a.id.toString() === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Asset not found' });

        assets[index] = {
            id: assets[index].id,
            name: name.trim(),
            category: category.trim(),
            weight,
            co2_saved: weight * 20
        };
        await writeData(assetsFilePath, assets);
        res.json(assets[index]);
    } catch (error) { next(error); }
});

// Delete asset
app.delete('/assets/:id', async (req, res, next) => {
    try {
        const assets = await readData(assetsFilePath);
        const index = assets.findIndex(a => a.id.toString() === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Asset not found' });
        const deleted = assets.splice(index, 1)[0];
        await writeData(assetsFilePath, assets);
        res.json({ message: 'Asset deleted', asset: deleted });
    } catch (error) { next(error); }
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
