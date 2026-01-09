import type { VercelRequest, VercelResponse } from '@vercel/node';

// URL-based multi-vault storage
// Each family gets a unique URL path that maps to their vault
// e.g., /cloninger → family-quest-vault-cloninger.json
//
// Setup:
// 1. Vercel Dashboard → Storage → Create → Blob
// 2. Connect to your project (auto-creates BLOB_READ_WRITE_TOKEN)

const VAULT_PREFIX = 'family-quest-vault-';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get family ID from query param
  const familyId = req.query.familyId as string;
  
  if (!familyId || !/^[a-z0-9-]+$/i.test(familyId)) {
    return res.status(400).json({ error: 'Invalid or missing familyId' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('BLOB_READ_WRITE_TOKEN not set');
    return res.status(503).json({ 
      error: 'Vault storage not configured',
      message: 'Set up Vercel Blob storage to enable cross-device sync'
    });
  }

  const { put, list } = await import('@vercel/blob');
  const filename = `${VAULT_PREFIX}${familyId.toLowerCase()}.json`;

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: filename });
      
      if (blobs.length === 0) {
        return res.status(200).json({ vault: null });
      }

      const response = await fetch(blobs[0].url);
      const data = await response.json();
      return res.status(200).json({ vault: data.vault });
    }

    if (req.method === 'POST') {
      const { vault } = req.body;
      
      if (typeof vault !== 'string') {
        return res.status(400).json({ error: 'Invalid vault data' });
      }

      await put(filename, JSON.stringify({ vault, updatedAt: new Date().toISOString() }), {
        access: 'public',
        addRandomSuffix: false,
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Vault API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
}
