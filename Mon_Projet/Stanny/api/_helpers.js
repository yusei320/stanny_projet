// Helper functions for Vercel serverless functions
const cors = require('cors');

// CORS middleware for serverless functions
const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Wrap serverless function with CORS
function withCors(handler) {
  return async (req, res) => {
    await new Promise((resolve, reject) => {
      corsMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    return handler(req, res);
  };
}

// Parse JSON body for serverless functions
function parseBody(req) {
  if (req.method === 'POST' || req.method === 'PUT') {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch (e) {
          req.body = {};
        }
        resolve();
      });
    });
  }
  return Promise.resolve();
}

module.exports = { withCors, parseBody };
