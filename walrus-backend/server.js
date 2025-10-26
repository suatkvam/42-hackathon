import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';

const execAsync = promisify(exec);
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Upload image to Walrus via CLI
app.post('/api/walrus/upload-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Run walrus store command
    const { stdout, stderr } = await execAsync(`walrus store ${filePath}`);
    
    // Parse blob_id from output
    // Expected format: "Blob ID: <blob_id>"
    const blobIdMatch = stdout.match(/[a-zA-Z0-9_-]{40,}/);
    
    if (!blobIdMatch) {
      console.error('Walrus output:', stdout, stderr);
      throw new Error('Could not extract blob_id from walrus output');
    }
    
    const blobId = blobIdMatch[0];
    
    // Clean up temp file
    await fs.unlink(filePath);
    
    res.json({ 
      blobId,
      url: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload JSON data to Walrus via CLI
app.post('/api/walrus/upload-json', async (req, res) => {
  try {
    const data = req.body;
    
    // Create temp JSON file
    const tempFile = path.join('uploads', `profile-${Date.now()}.json`);
    await fs.writeFile(tempFile, JSON.stringify(data));
    
    // Run walrus store command
    const { stdout, stderr } = await execAsync(`walrus store ${tempFile}`);
    
    // Parse blob_id from output
    const blobIdMatch = stdout.match(/[a-zA-Z0-9_-]{40,}/);
    
    if (!blobIdMatch) {
      console.error('Walrus output:', stdout, stderr);
      throw new Error('Could not extract blob_id from walrus output');
    }
    
    const blobId = blobIdMatch[0];
    
    // Clean up temp file
    await fs.unlink(tempFile);
    
    res.json({ 
      blobId,
      url: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Walrus backend running on port ${PORT}`);
});
