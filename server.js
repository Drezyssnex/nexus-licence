const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

app.use(cors());
app.use(express.json());

// ============================================
// ⚠️ TOTO ZMĚŇ NA SVÉ HODNOTY!
// ============================================

const SECRET = 'muj-tajny-klic-2026';
const ADMIN_TOKEN = 'admin-token-2026';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1522660774022221988/y8LhkX80TwFCYMpcHrkOb8_5a80hx_fH4uU3YgeC7TM9tyMLQ18hVBJWFYisxHt6N8MU'

// ============================================

// Databáze použitých klíčů
const usedKeys = new Set();

// PRO klíče (pouze pro tebe)
const PRO_KEYS = [
    'NEXUS-DEVELOPER-2026',
    'NEXUS-PRO-MASTER'
];

// Generování denního klíče
function generateDailyKey() {
    const today = new Date().toISOString().split('T')[0];
    const hash = crypto.createHash('sha256')
        .update(`NEXUS-${today}-${SECRET}`)
        .digest('hex')
        .substring(0, 12)
        .toUpperCase();
    
    return `NXS-${hash.slice(0,4)}-${hash.slice(4,8)}-${hash.slice(8,12)}`;
}

// ============================================
// API ENDPOINTY
// ============================================

// Hlavní endpoint - ověření klíče
app.post('/api/validate', (req, res) => {
    const { key } = req.body;
    
    if (!key) {
        return res.json({ 
            valid: false, 
            message: '❌ Zadej aktivační kód' 
        });
    }
    
    const upperKey = key.toUpperCase().trim();
    
    // PRO klíče
    if (PRO_KEYS.includes(upperKey)) {
        return res.json({ 
            valid: true, 
            type: 'PRO',
            message: '✅ PRO licence aktivována'
        });
    }
    
    // Kontrola jestli už byl použitý
    if (usedKeys.has(upperKey)) {
        return res.json({ 
            valid: false, 
            message: '❌ Tento kód již byl použit'
        });
    }
    
    // Denní klíč
    const todayKey = generateDailyKey();
    if (upperKey === todayKey) {
        usedKeys.add(upperKey);
        return res.json({ 
            valid: true, 
            type: 'FREE',
            expiry: Date.now() + (24 * 60 * 60 * 1000),
            message: '✅ Licence aktivována na 24h'
        });
    }
    
    return res.json({ 
        valid: false, 
        message: '❌ Neplatný nebo expirovaný kód'
    });
});

// Získání dnešního klíče (pouze admin)
app.get('/api/today', (req, res) => {
    const token = req.headers.authorization;
    if (token !== `Bearer ${ADMIN_TOKEN}`) {
        return res.status(403).json({ error: 'Nepovoleno' });
    }
    
    const key = generateDailyKey();
    res.json({ 
        key,
        used: usedKeys.has(key),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
});

// Statistiky
app.get('/api/stats', (req, res) => {
    const token = req.headers.authorization;
    if (token !== `Bearer ${ADMIN_TOKEN}`) {
        return res.status(403).json({ error: 'Nepovoleno' });
    }
    
    res.json({
        usedKeys: usedKeys.size,
        proKeys: PRO_KEYS.length,
        todayKey: generateDailyKey(),
        isUsed: usedKeys.has(generateDailyKey())
    });
});

// ============================================
// SPUŠTĚNÍ
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('✅ NEXUS Licence Server běží!');
    console.log(`🔑 Dnešní klíč: ${generateDailyKey()}`);
    console.log(`📊 Použité klíče: ${usedKeys.size}`);
});
