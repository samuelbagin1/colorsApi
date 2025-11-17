import { connectToDatabase } from '../lib/connectToDatabase.js';
import { ObjectId } from 'mongodb';

export const config = { maxDuration: 15 };

export default async (req, res) => {
  // CORS Configuration - Allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      // GET - Fetch all pigment color items
      const items = await db.collection('pigmentColors').find().sort({ createdAt: -1 }).toArray();
      return res.status(200).json(items);

    } else if (req.method === 'POST') {
      // POST - Append new pigment color pairs
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      return new Promise((resolve) => {
        req.on('end', async () => {
          try {
            const colorPairs = JSON.parse(body);
            
            // Validate that we received an object
            if (typeof colorPairs !== 'object' || colorPairs === null) {
              return resolve(res.status(400).json({ 
                error: 'Invalid data format. Expected an object with color pairs.' 
              }));
            }

            // Get the highest existing pair number
            const lastItem = await db.collection('pigmentColors')
              .find()
              .sort({ pairNumber: -1 })
              .limit(1)
              .toArray();
            
            let nextPairNumber = lastItem.length > 0 ? lastItem[0].pairNumber + 1 : 1;

            // Prepare documents for insertion
            const documentsToInsert = [];
            const hexRegex = /^#[0-9A-F]{6}$/i;

            for (const [pairKey, colors] of Object.entries(colorPairs)) {
              // Extract pair number from key (e.g., "pair072" -> 72)
              const pairNumberMatch = pairKey.match(/pair(\d+)/);
              const pairNumber = pairNumberMatch ? parseInt(pairNumberMatch[1], 10) : nextPairNumber++;

              // Validate colors
              if (!colors.primary || !colors.secondary) {
                return resolve(res.status(400).json({ 
                  error: `Missing primary or secondary color for ${pairKey}` 
                }));
              }

              if (!hexRegex.test(colors.primary) || !hexRegex.test(colors.secondary)) {
                return resolve(res.status(400).json({ 
                  error: `Invalid color format in ${pairKey}. Colors must be in hex format (e.g., #EB8D31)` 
                }));
              }

              documentsToInsert.push({
                pairNumber,
                pairId: pairKey,
                primary: colors.primary,
                secondary: colors.secondary,
                _id: new ObjectId()
              });
            }

            // Insert all documents
            if (documentsToInsert.length > 0) {
              const result = await db.collection('pigmentColors').insertMany(documentsToInsert);
              return resolve(res.status(201).json({ 
                message: `Successfully inserted ${documentsToInsert.length} color pairs`,
                insertedCount: result.insertedCount,
                pairs: documentsToInsert.map(doc => doc.pairId)
              }));
            } else {
              return resolve(res.status(400).json({ 
                error: 'No valid color pairs to insert' 
              }));
            }

          } catch (error) {
            console.error('Pigment Color Post Error:', error);
            return resolve(res.status(400).json({ 
              error: 'Invalid JSON data or processing error',
              details: error.message
            }));
          }
        });
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Pigment Colors API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.stack 
    });
  }
};