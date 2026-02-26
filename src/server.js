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
const analysesFilePath = path.join(__dirname, '..', 'data', 'analyses.json');

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

// Analyze inventory — local heuristic (French)
app.post('/assets/analyze', async (req, res, next) => {
    try {
        const items = Array.isArray(req.body.items) && req.body.items.length > 0
            ? req.body.items
            : await readData(assetsFilePath);

        if (items.length === 0) {
            return res.json({ analysis: 'Aucun équipement dans l\'inventaire. Ajoutez des actifs pour obtenir une analyse.' });
        }

        // Build category stats
        const byCategory = {};
        items.forEach(it => {
            const cat = (it.category || 'Autre').toString();
            byCategory[cat] = byCategory[cat] || { count: 0, weight: 0, co2: 0 };
            byCategory[cat].count += 1;
            byCategory[cat].weight += Number(it.weight || 0);
            byCategory[cat].co2 += Number(it.co2_saved || (it.weight || 0) * 20);
        });

        const categories = Object.entries(byCategory)
            .map(([k, v]) => ({ category: k, ...v }))
            .sort((a, b) => b.co2 - a.co2);

        const topDevices = items.slice()
            .sort((a, b) => (b.co2_saved || 0) - (a.co2_saved || 0))
            .slice(0, 3);

        const suggestions = [
            `Prioriser la remise en service des appareils à fort impact CO₂ (ex: ${topDevices.map(d => d.name).join(', ')}). Cela maximise le CO₂ économisé par action.`,
            `Concentrer les efforts sur la catégorie "${categories[0].category}" (~${categories[0].co2.toFixed(0)} kg CO₂ économisés) : améliorer le taux de réutilisation et optimiser le cycle de vie.`,
            `Mettre en place un programme de collecte et de réparation local pour réduire les transports et prolonger la durée de vie des équipements.`
        ];

        const analysisText = `Analyse automatique :\n1) ${suggestions[0]}\n2) ${suggestions[1]}\n3) ${suggestions[2]}`;

        // Persist analysis record (newest first)
        const record = { id: Date.now(), createdAt: new Date().toISOString(), analysis: analysisText };
        try {
            const history = await readData(analysesFilePath);
            history.unshift(record);
            await writeData(analysesFilePath, history);
        } catch (persistError) {
            console.warn('Could not persist analysis:', persistError.message);
        }

        return res.json({ analysis: analysisText, id: record.id });
    } catch (error) { next(error); }
});

// Get analysis history
app.get('/assets/analysis', async (req, res, next) => {
    try {
        const history = await readData(analysesFilePath);
        res.json(history);
    } catch (error) { next(error); }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
