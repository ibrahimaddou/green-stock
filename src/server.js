import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
const port = 3000;

app.use(express.json());

const assetsFilePath = path.resolve('data/items.json');

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

// Helper function to write data
const writeData = async (filePath, data) => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Get all assets
app.get('/assets', async (req, res) => {
    const assets = await readData(assetsFilePath);
    res.json(assets);
});

// Add a new asset
app.post('/assets', async (req, res) => {
    const assets = await readData(assetsFilePath);
    const { name, category, weight } = req.body;

    if (!name || !category || !weight) {
        return res.status(400).json({ message: 'Missing required fields: name, category, weight' });
    }

    const newAsset = {
        id: Date.now(),
        name,
        category,
        weight,
        co2_saved: weight * 20
    };

    assets.push(newAsset);
    await writeData(assetsFilePath, assets);
    res.status(201).json(newAsset);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
