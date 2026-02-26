import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const port = 3000;

// Initialiser Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

// Analyze inventory — Groq AI with local heuristic fallback
app.post('/assets/analyze', async (req, res, next) => {
    try {
        const items = Array.isArray(req.body.items) && req.body.items.length > 0
            ? req.body.items
            : await readData(assetsFilePath);

        if (items.length === 0) {
            return res.json({
                recommendations: [{
                    priority: 'high',
                    title: '📦 Aucun équipement',
                    description: 'Ajoutez des actifs à votre inventaire pour obtenir une analyse personnalisée.',
                    icon: '📦'
                }]
            });
        }

        // Build category stats (used for both AI and fallback)
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

        const totalCo2 = items.reduce((sum, it) => sum + Number(it.co2_saved || (it.weight || 0) * 20), 0);

        let recommendations;

        // Tenter l'analyse IA via Groq
        try {
            const inventorySummary = `
Inventaire de ${items.length} équipements reconditionnés :
- Catégories : ${categories.map(c => `${c.category} (${c.count} appareils, ${c.co2.toFixed(0)} kg CO₂ économisés)`).join(', ')}
- Top appareils par impact CO₂ : ${topDevices.map(d => `${d.name} (${d.co2_saved || 0} kg)`).join(', ')}
- CO₂ total économisé : ${totalCo2.toFixed(0)} kg
- Poids total : ${items.reduce((s, i) => s + Number(i.weight || 0), 0).toFixed(1)} kg
            `.trim();

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un expert en IT reconditionné et développement durable. 
Tu dois analyser l'inventaire fourni et proposer exactement 3 recommandations concrètes au format JSON.
IMPORTANT: Ton message doit contenir UNIQUEMENT un tableau JSON valide. Pas de texte avant, pas de texte après.

Structure attendue :
[
  {
    "priority": "high",
    "title": "Titre court",
    "description": "Explication détaillée de l'action.",
    "icon": "📱"
  }
]

Règles :
- Les priorités autorisées : "high", "medium", "low".
- L'icon doit être un emoji unique.
- La description doit mentionner des données de l'inventaire si possible.`
                    },
                    {
                        role: 'user',
                        content: `Analyse cet inventaire et donne 3 recommandations :\n${inventorySummary}`
                    }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 1024,
            });

            const aiResponse = chatCompletion.choices[0]?.message?.content || '';
            
            // Nettoyage agressif des caractères non-imprimables/malformés
            const cleanedResponse = aiResponse
                .replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // Supprime les caractères non-imprimables et le caractère de remplacement 
                .trim();

            // Extraire le JSON de la réponse de manière plus robuste
            let jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
            let jsonString = jsonMatch ? jsonMatch[0] : null;

            if (jsonString) {
                try {
                    recommendations = JSON.parse(jsonString);
                } catch (parseError) {
                    console.warn('⚠️ Échec du parse initial, tentative de nettoyage...', parseError.message);
                    // Nettoyage secondaire si l'IA a mis des emojis sans guillemets ou d'autres erreurs communes
                    const fixedJson = jsonString
                        .replace(/"icon":\s*([^"\s,\]}]+)/g, '"icon": "$1"') // ajoute des guillemets aux emojis sans quotes
                        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // ajoute des guillemets aux clés non-quotées
                        .replace(/'/g, '"'); // remplace les simples quotes par des doubles quotes
                    
                    try {
                        recommendations = JSON.parse(fixedJson);
                    } catch (e2) {
                        throw new Error(`JSON invalide (même après nettoyage) : ${e2.message}`);
                    }
                }

                // S'assurer que recommendations est un tableau
                if (!Array.isArray(recommendations)) {
                    if (recommendations.recommendations) recommendations = recommendations.recommendations;
                    else recommendations = [recommendations];
                }

                // Normalisation finale des objets
                recommendations = recommendations.slice(0, 3).map(r => ({
                    priority: ['high', 'medium', 'low'].includes(String(r.priority || '').toLowerCase()) 
                        ? String(r.priority).toLowerCase() 
                        : 'medium',
                    title: String(r.title || 'Action suggérée').substring(0, 80),
                    description: String(r.description || 'Amélioration de durabilité recommandée.').substring(0, 250),
                    icon: String(r.icon || '💡').substring(0, 8) // Garde l'emoji (parfois codé sur plusieurs bytes)
                }));
                console.log('✅ Analyse IA Groq réussie');
            } else {
                throw new Error('Aucun tableau JSON trouvé dans la réponse IA');
            }

        } catch (aiError) {
            console.warn('⚠️ Groq IA indisponible, fallback heuristique :', aiError.message);
            
            // Fallback : heuristique locale
            recommendations = [
                {
                    priority: 'high',
                    title: 'Prioriser les appareils high-impact',
                    description: `Remise en service urgente : ${topDevices.map(d => d.name).join(', ')}. Cela maximise le CO₂ économisé par action (${totalCo2.toFixed(0)} kg au total).`,
                    icon: '⚡'
                },
                {
                    priority: 'medium',
                    title: `Optimiser la catégorie "${categories[0]?.category || 'équipements'}"`,
                    description: `Focus sur ~${categories[0]?.co2.toFixed(0) || 0} kg CO₂ économisés : améliorer le taux de réutilisation et optimiser le cycle de vie de ${categories[0]?.count || 0} appareils.`,
                    icon: '♻️'
                },
                {
                    priority: 'low',
                    title: 'Programme local de collecte',
                    description: 'Mettre en place un programme de collecte et de réparation local pour réduire les transports et prolonger la durée de vie des équipements.',
                    icon: '🌱'
                }
            ];
        }

        // Persist analysis record (newest first)
        const record = { id: Date.now(), createdAt: new Date().toISOString(), recommendations };
        try {
            const history = await readData(analysesFilePath);
            history.unshift(record);
            await writeData(analysesFilePath, history);
        } catch (persistError) {
            console.warn('Could not persist analysis:', persistError.message);
        }

        return res.json({ recommendations, id: record.id });
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
