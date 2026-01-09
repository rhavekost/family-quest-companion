import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple server-side vault storage using Vercel Blob
// The vault is stored encrypted - server never sees plaintext credentials
//
// For this to work, you need to:
// 1. Go to your Vercel project dashboard
// 2. Go to Storage → Create Database → Blob
// 3. Connect it to your project (this auto-creates BLOB_READ_WRITE_TOKEN)

const VAULT_FILENAME = 'family-quest-vault.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if Blob storage is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('BLOB_READ_WRITE_TOKEN not set - vault sync disabled');
    return res.status(503).json({ 
      error: 'Vault storage not configured',
      message: 'Set up Vercel Blob storage to enable cross-device sync'
    });
  }

  // Dynamic import to avoid issues if blob isn't configured
  const { put, list } = await import('@vercel/blob');

  try {
    if (req.method === 'GET') {
      // Find the vault blob
      const { blobs } = await list({ prefix: VAULT_FILENAME });
      
      if (blobs.length === 0) {
        return res.status(200).json({ vault: null });
      }

      // Fetch the vault content
      const response = await fetch(blobs[0].url);
      const data = await response.json();
      return res.status(200).json({ vault: data.vault });
    }

    if (req.method === 'POST') {
      // Save the encrypted vault
      const { vault } = req.body;
      
      if (typeof vault !== 'string') {
        return res.status(400).json({ error: 'Invalid vault data' });
      }

      // Store as JSON blob (overwrites existing)
      await put(VAULT_FILENAME, JSON.stringify({ vault, updatedAt: new Date().toISOString() }), {
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
