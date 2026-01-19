/**
 * Mock FCM Token Management Backend
 * 
 * This simulates a real backend server for learning purposes.
 * In production, you'd have proper authentication, database, etc.
 * 
 * Run: node mock-backend/server.js
 */

const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory database (in production: use PostgreSQL, MongoDB, etc.)
const tokenDatabase = new Map();

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`\n📥 ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
});

/**
 * Register or update a token
 * POST /register-token
 * Body: { token: string, userId?: string, platform?: string }
 */
app.post('/register-token', (req, res) => {
  const { token, userId, platform } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  // Check if token already exists
  const existing = tokenDatabase.get(token);
  
  if (existing) {
    console.log('✅ Token already registered, updating lastActive');
    existing.lastActive = new Date().toISOString();
    if (userId) existing.userId = userId;
    tokenDatabase.set(token, existing);
  } else {
    console.log('🆕 New token registered');
    tokenDatabase.set(token, {
      token,
      userId: userId || 'anonymous',
      platform: platform || 'unknown',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Token registered successfully',
    totalTokens: tokenDatabase.size 
  });
});

/**
 * Associate token with a user (login)
 * POST /login
 * Body: { token: string, userId: string }
 */
app.post('/login', (req, res) => {
  const { token, userId } = req.body;
  
  if (!token || !userId) {
    return res.status(400).json({ error: 'Token and userId required' });
  }
  
  const tokenData = tokenDatabase.get(token);
  
  if (tokenData) {
    tokenData.userId = userId;
    tokenData.lastActive = new Date().toISOString();
    tokenDatabase.set(token, tokenData);
    console.log(`✅ Token associated with user: ${userId}`);
  } else {
    // Token not found, register it
    tokenDatabase.set(token, {
      token,
      userId,
      platform: 'unknown',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
    console.log(`🆕 New token registered for user: ${userId}`);
  }
  
  res.json({ success: true, message: `Logged in as ${userId}` });
});

/**
 * Remove token (logout)
 * POST /logout
 * Body: { token: string }
 */
app.post('/logout', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  if (tokenDatabase.has(token)) {
    tokenDatabase.delete(token);
    console.log('✅ Token removed (user logged out)');
    res.json({ success: true, message: 'Logged out successfully' });
  } else {
    console.log('⚠️ Token not found (already removed?)');
    res.json({ success: true, message: 'Token not found (already logged out)' });
  }
});

/**
 * Get all tokens for a user
 * GET /user/:userId/tokens
 */
app.get('/user/:userId/tokens', (req, res) => {
  const { userId } = req.params;
  
  const userTokens = Array.from(tokenDatabase.values())
    .filter(t => t.userId === userId);
  
  console.log(`📋 Found ${userTokens.length} tokens for user ${userId}`);
  
  res.json({ 
    userId, 
    tokens: userTokens,
    count: userTokens.length 
  });
});

/**
 * Get all registered tokens (for debugging)
 * GET /tokens
 */
app.get('/tokens', (req, res) => {
  const allTokens = Array.from(tokenDatabase.values());
  
  res.json({
    total: allTokens.length,
    tokens: allTokens.map(t => ({
      userId: t.userId,
      platform: t.platform,
      tokenPreview: t.token.substring(0, 20) + '...',
      createdAt: t.createdAt,
      lastActive: t.lastActive,
    }))
  });
});

/**
 * Cleanup stale tokens (in production: run as cron job)
 * DELETE /cleanup-stale
 */
app.delete('/cleanup-stale', (req, res) => {
  const daysThreshold = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
  
  let removed = 0;
  
  for (const [token, data] of tokenDatabase.entries()) {
    const lastActive = new Date(data.lastActive);
    if (lastActive < cutoffDate) {
      tokenDatabase.delete(token);
      removed++;
    }
  }
  
  console.log(`🧹 Cleaned up ${removed} stale tokens (inactive > ${daysThreshold} days)`);
  
  res.json({
    success: true,
    message: `Removed ${removed} stale tokens`,
    remaining: tokenDatabase.size
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Mock FCM Backend Server Started!');
  console.log(`📍 Listening on http://localhost:${PORT}`);
  console.log('\n📚 Available endpoints:');
  console.log('  POST   /register-token  - Register/update token');
  console.log('  POST   /login           - Associate token with user');
  console.log('  POST   /logout          - Remove token');
  console.log('  GET    /user/:id/tokens - Get all tokens for a user');
  console.log('  GET    /tokens          - View all tokens');
  console.log('  DELETE /cleanup-stale   - Remove inactive tokens');
  console.log('\n💡 For Android emulator, app should connect to: http://10.0.2.2:3000');
  console.log('💡 For physical device, replace with your machine IP\n');
});
