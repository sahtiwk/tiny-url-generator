const express = require('express');
const rateLimit = require('express-rate-limit');
const ShortUrl = require('./models/shortUrls');
const dbConnect = require('./utils/db');
require('dotenv').config();

const app = express();

// Trust Vercel's proxy for accurate IP rate limiting
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many URL creations from this IP, please try again after 15 minutes',
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', async (req, res, next) => {
  await dbConnect();
  // Limit to 50 and sort by most recent to prevent memory exhaustion
  const shortUrls = await ShortUrl.find().sort({ _id: -1 }).limit(50);
  res.render('index', { shortUrls });
});

app.post('/shortUrls', limiter, async (req, res, next) => {
  await dbConnect();
  if (!req.body.fullUrl) {
    return res.status(400).send('URL is required');
  }
  await ShortUrl.create({ full: req.body.fullUrl });
  res.redirect('/');
});

app.get('/:shortUrl', async (req, res, next) => {
  await dbConnect();
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (!shortUrl) return res.sendStatus(404);
  shortUrl.clicks++;
  await shortUrl.save();
  res.redirect(shortUrl.full);
});

// Global Error Handler for Express 5 (catches async promise rejections)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).send('Invalid input: ' + err.message);
  }
  res.status(500).send('Internal Server Error');
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
