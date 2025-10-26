#!/usr/bin/env node
const http = require('http');
const https = require('https');

const PORT = 3000;
const SITE_OBJECT_ID = '0x7ef6d650445f7c27d99c2745d6433f9410618466de3f73d9a2d9eaae5dea5538';
const AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space/v1';
const SUI_RPC = 'https://fullnode.testnet.sui.io:443';

// Fetch site data from Sui
async function fetchSiteFromSui(objectId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sui_getObject',
      params: [objectId, { showContent: true }]
    });

    const options = {
      hostname: 'fullnode.testnet.sui.io',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Fetch blob from Walrus
async function fetchBlob(blobId) {
  return new Promise((resolve, reject) => {
    const url = `${AGGREGATOR_URL}/${blobId}`;
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Simple server
const server = http.createServer(async (req, res) => {
  try {
    console.log(`Request: ${req.url}`);
    
    // Get site data
    const siteData = await fetchSiteFromSui(SITE_OBJECT_ID);
    const content = siteData.data.content;
    
    if (!content || !content.fields) {
      res.writeHead(500);
      res.end('Invalid site data');
      return;
    }

    const resources = content.fields.resources || [];
    
    // Find requested resource
    let requestPath = req.url === '/' ? '/index.html' : req.url;
    let resource = resources.find(r => r.fields.path === requestPath);
    
    if (!resource) {
      res.writeHead(404);
      res.end('Resource not found');
      return;
    }

    // Fetch blob
    const blobId = resource.fields.blob_id;
    console.log(`Fetching blob: ${blobId}`);
    const blobData = await fetchBlob(blobId);
    
    // Determine content type
    let contentType = 'text/html';
    if (requestPath.endsWith('.css')) contentType = 'text/css';
    else if (requestPath.endsWith('.js')) contentType = 'application/javascript';
    else if (requestPath.endsWith('.png')) contentType = 'image/png';
    else if (requestPath.endsWith('.jpg')) contentType = 'image/jpeg';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(blobData);
    
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end('Internal server error: ' + error.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Walrus Sites Portal running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Site Object ID: ${SITE_OBJECT_ID}\n`);
});
