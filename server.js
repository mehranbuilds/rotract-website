/**
 * Rotaract Club of SIES Sion East - Backend Server
 * Built with Node.js & Express
 * 
 * Features:
 * - High-resilience error handling (global middleware, uncaught exception traps)
 * - Configurable CORS for cross-origin frontend communication
 * - Safe data persistence with in-memory fallback
 * - Secure input validation and sanitization
 * - Serving static client files alongside API routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// --------------------------------------------------------------------------
// 1. Process-Level Resilience (Never crash on unhandled errors)
// --------------------------------------------------------------------------
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL UNCAUGHT EXCEPTION]:', err.message);
  console.error(err.stack);
  // Keep process running safely in development / supervision mode
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL UNHANDLED REJECTION]:', reason);
});

// --------------------------------------------------------------------------
// 2. Data Persistence Setup (In-Memory with Disk Backup)
// --------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage Warning] Could not create data directory, using memory store:', e.message);
}

// In-Memory storage with safe disk sync
let inquiries = [];
let subscribers = [];

function loadData() {
  try {
    if (fs.existsSync(INQUIRIES_FILE)) {
      const raw = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
      inquiries = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Storage Notice] Initializing fresh inquiries memory cache:', err.message);
    inquiries = [];
  }

  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      subscribers = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Storage Notice] Initializing fresh subscribers memory cache:', err.message);
    subscribers = [];
  }
}

function persistData() {
  try {
    if (fs.existsSync(DATA_DIR)) {
      fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf-8');
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[Storage Notice] Failed to persist data to disk:', err.message);
  }
}

loadData();

// --------------------------------------------------------------------------
// 3. Security, CORS & Parsing Middleware
// --------------------------------------------------------------------------

// Configure CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, or file:// where origin is 'null')
    if (!origin || origin === 'null') {
      return callback(null, true);
    }

    // Always allow localhost / 127.0.0.1 development ports
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isExplicitlyAllowed = allowedOrigins.includes(origin);

    if (isLocalhost || isExplicitlyAllowed || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      console.warn(`[CORS Notice] Allowing unlisted origin during dev: ${origin}`);
      callback(null, true); // Dev-friendly fallback
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// JSON & URL-Encoded body parsers with limits to prevent Denial-of-Service
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Middleware to gracefully intercept malformed JSON payloads
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload provided in request body.'
    });
  }
  next(err);
});

// Request Logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// --------------------------------------------------------------------------
// 4. API Routes with Complete Error Handling & Input Validation
// --------------------------------------------------------------------------

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      status: 'UP',
      club: 'Rotaract Club of SIES Sion East',
      theme: 'द्रोणाचार्य',
      district: '3141',
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      connectionsCount: inquiries.length,
      subscribersCount: subscribers.length
    });
  } catch (error) {
    console.error('Error in /api/health:', error);
    res.status(500).json({ success: false, error: 'Internal health check error' });
  }
});

// Get Flagship Projects Information (Past Initiatives)
app.get('/api/projects', (req, res) => {
  try {
    const projects = [
      {
        id: 1,
        title: 'LinkedIn & CV Workshop',
        category: 'Career Skills',
        status: 'Completed',
        description: 'A practical workshop where college students learned how to write clean resumes, build their LinkedIn profile, and prepare for job interviews.'
      },
      {
        id: 2,
        title: 'IPR Law Seminar',
        category: 'Legal Awareness',
        status: 'Completed',
        description: 'A beginner-friendly session on patents, trademarks, and copyright laws to help students protect their original ideas and projects.'
      },
      {
        id: 3,
        title: 'Whisper & Lies Game Night',
        category: 'Fellowship',
        status: 'Completed',
        description: 'A fun mystery game evening where members solved clues, tested deduction skills, and made new friends.'
      },
      {
        id: 4,
        title: 'Beach Volleyball Tournament',
        category: 'Sports & Fitness',
        status: 'Completed',
        description: 'An active beach sports day on the sand where club members and friends teamed up for friendly volleyball matches.'
      },
      {
        id: 5,
        title: 'One Prompt Many Stories',
        category: 'Creative Arts',
        status: 'Completed',
        description: 'A creative writing contest where participants received one exciting prompt to write short stories, poetry, and reflections.'
      }
    ];

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error in /api/projects:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve projects.' });
  }
});

// Get Upcoming and Past Events
app.get('/api/events', (req, res) => {
  try {
    const upcoming = [
      {
        id: 'upcoming-1',
        title: 'Youth Leadership Conclave 2026',
        date: 'Saturday, 24th October 2026 • 10:00 AM',
        location: 'SIES Campus Auditorium, Sion East',
        status: 'Registrations Open',
        description: 'An interactive one-day conference connecting college students with experienced professionals, youth leaders, and changemakers across Mumbai.'
      },
      {
        id: 'upcoming-2',
        title: 'Community Blood Donation & Health Camp',
        date: 'Sunday, 8th November 2026 • 9:00 AM',
        location: 'Sion East Community Hall, Mumbai',
        status: 'Volunteers Welcome',
        description: 'A life-saving blood donation and basic health check camp organized in partnership with local doctors and hospitals.'
      },
      {
        id: 'upcoming-3',
        title: 'Dronacharya Box Cricket & Sports Meet',
        date: 'Saturday, 21st November 2026 • 8:00 AM',
        location: 'SIES Sports Turf & Grounds',
        status: 'Team Entries Open',
        description: 'A weekend sports day bringing college students together for fast-paced box cricket matches, fun athletic games, and team spirit.'
      }
    ];

    res.status(200).json({
      success: true,
      upcomingCount: upcoming.length,
      upcoming
    });
  } catch (error) {
    console.error('Error in /api/events:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve events.' });
  }
});

// Connect / Inquiries Endpoint (Handles Form Submissions)
app.post('/api/connect', (req, res) => {
  try {
    const { name, email, phone, category, interest, message } = req.body;

    // Field Validation
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long.');
    } else if (name.trim().length > 100) {
      errors.push('Name must not exceed 100 characters.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      errors.push('A valid email address is required.');
    }

    if (phone && (typeof phone !== 'string' || phone.trim().length > 25)) {
      errors.push('Phone number is invalid.');
    }

    if (!message || typeof message !== 'string' || message.trim().length < 3) {
      errors.push('Message must be at least 3 characters long.');
    } else if (message.trim().length > 2000) {
      errors.push('Message must not exceed 2000 characters.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Sanitize and construct submission record
    const newInquiry = {
      id: 'conn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      category: category && typeof category === 'string' ? category.trim() : 'General Inquiry',
      interest: interest && typeof interest === 'string' ? interest.trim() : 'General Interest',
      message: message.trim(),
      submittedAt: new Date().toISOString(),
      clientIp: req.ip
    };

    inquiries.push(newInquiry);
    persistData();

    console.log(`[Connect Success] New inquiry from: ${newInquiry.name} <${newInquiry.email}> - Interest: ${newInquiry.interest}`);

    return res.status(201).json({
      success: true,
      message: 'Thank you for connecting with RC SIES Sion East! Our secretariat has received your details and will get back to you shortly.',
      data: {
        id: newInquiry.id,
        name: newInquiry.name,
        email: newInquiry.email,
        interest: newInquiry.interest,
        submittedAt: newInquiry.submittedAt
      }
    });
  } catch (error) {
    console.error('Error handling /api/connect:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your connection request. Please try again.'
    });
  }
});

// Retrieve recent inquiries summary (Safe preview)
app.get('/api/connect/recent', (req, res) => {
  try {
    const safeSummary = inquiries.slice(-10).map(inq => ({
      id: inq.id,
      name: inq.name,
      interest: inq.interest,
      category: inq.category,
      submittedAt: inq.submittedAt
    }));

    res.status(200).json({
      success: true,
      totalCount: inquiries.length,
      recent: safeSummary
    });
  } catch (error) {
    console.error('Error in /api/connect/recent:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve inquiries summary.' });
  }
});

// Newsletter / Updates Subscription Endpoint
app.post('/api/newsletter', (req, res) => {
  try {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = subscribers.find(s => s.email === cleanEmail);

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to RC SIES Sion East updates!',
        data: { email: cleanEmail }
      });
    }

    const newSub = {
      id: 'sub_' + Date.now(),
      email: cleanEmail,
      subscribedAt: new Date().toISOString()
    };

    subscribers.push(newSub);
    persistData();

    console.log(`[Newsletter Success] New subscriber: ${cleanEmail}`);

    return res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to updates from RC SIES Sion East (द्रोणाचार्य)!',
      data: { email: cleanEmail }
    });
  } catch (error) {
    console.error('Error in /api/newsletter:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process newsletter subscription.'
    });
  }
});

// Admin Passcode Verification Endpoint
app.post('/api/admin/verify', (req, res) => {
  try {
    const { passcode } = req.body;
    const expectedPasscode = process.env.ADMIN_KEY || 'rcsiesse2026';

    if (passcode && passcode.trim() === expectedPasscode) {
      return res.status(200).json({
        success: true,
        message: 'Admin authorization granted.',
        token: expectedPasscode
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid admin passcode. Access denied.'
    });
  } catch (error) {
    console.error('Error in /api/admin/verify:', error);
    res.status(500).json({ success: false, error: 'Verification error' });
  }
});

// Admin Dashboard API to inspect inquiries and subscribers (RESTRICTED TO ADMINS)
app.get('/api/admin/data', (req, res) => {
  try {
    const expectedPasscode = process.env.ADMIN_KEY || 'rcsiesse2026';
    const providedKey = req.headers['x-admin-key'] || req.query.key;

    if (!providedKey || providedKey !== expectedPasscode) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Admin passcode required to view records.'
      });
    }

    loadData(); // Sync latest data from disk
    res.status(200).json({
      success: true,
      inquiriesCount: inquiries.length,
      subscribersCount: subscribers.length,
      uptime: `${Math.floor(process.uptime())}s`,
      inquiries,
      subscribers
    });
  } catch (error) {
    console.error('Error in /api/admin/data:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve admin data.' });
  }
});

// Serve Admin Dashboard page
app.get('/admin', (req, res) => {
  try {
    const adminPath = path.join(__dirname, 'admin.html');
    if (fs.existsSync(adminPath)) {
      res.sendFile(adminPath);
    } else {
      res.status(404).send('Admin page not found.');
    }
  } catch (error) {
    console.error('Error serving admin page:', error);
    res.status(500).send('Error loading admin page.');
  }
});

// Serve frontend main page on root
app.get('/', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'rotaract_club_of_sies_sion_east.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).send('HTML file not found.');
    }
  } catch (error) {
    console.error('Error serving root page:', error);
    res.status(500).send('Error loading page.');
  }
});

// --------------------------------------------------------------------------
// 5. 404 Route Interceptor for Unknown Endpoints
// --------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.originalUrl}' not found on this server.`
  });
});

// --------------------------------------------------------------------------
// 6. Global Express Error-Handling Middleware (Crash-Proof Interceptor)
// --------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[Global Error Intercepted]:', err.stack || err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  const message = NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error. Please contact the administrator.'
    : (err.message || 'An unexpected runtime error occurred.');

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode: statusCode
  });
});

// --------------------------------------------------------------------------
// 7. Server Listener
// --------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Rotaract Club of SIES Sion East Server Running!`);
  console.log(`📍 Port:           http://localhost:${PORT}`);
  console.log(`🩺 Health Check:   http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment:    ${NODE_ENV}`);
  console.log(`🛡️  CORS Origins:   ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'All Localhost & File'}`);
  console.log('====================================================');
});

// Graceful termination handler
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
