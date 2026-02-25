const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const canvasRoutes = require('./routes/canvas');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { mountMcp } = require('./mcp/server');

const app = express();
const PORT = process.env.PORT || 3001;

// Behind reverse proxies (Nginx + Traefik): trust first proxy for correct IP in X-Forwarded-For
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:80',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Stricter rate limit for AI chat (30 req/min per IP)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many AI requests, please slow down.'
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/canvas', canvasRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// MCP server (Model Context Protocol)
mountMcp(app);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
