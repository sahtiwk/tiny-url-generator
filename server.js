const express = require('express');
const rateLimit = require('express-rate-limit');
const ShortUrl = require('./models/shortUrls');
const dbConnect = require('./utils/db');
require('dotenv').config();


const { Redis } = require('@upstash/redis');

const redisClient = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  : null;

const app = express();

app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many URL creations from this IP, please try again after 15 minutes',
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', async (req, res, next) => {
  await dbConnect();
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
  const { shortUrl } = req.params;

  try {
    let cachedFullUrl = null;

    if (redisClient) {
      cachedFullUrl = await redisClient.get(shortUrl);
    }

    if (cachedFullUrl) {
      ShortUrl.updateOne({ short: shortUrl }, { $inc: { clicks: 1 } }).exec().catch(console.error);
      return res.redirect(cachedFullUrl);
    }

    const urlDoc = await ShortUrl.findOne({ short: shortUrl });
    if (!urlDoc) return res.sendStatus(404);

    if (redisClient) {
      // @upstash/redis syntax for expiration
      await redisClient.set(shortUrl, urlDoc.full, { ex: 86400 });
    }

    ShortUrl.updateOne({ short: shortUrl }, { $inc: { clicks: 1 } }).exec().catch(console.error);

    res.redirect(urlDoc.full);
  } catch (error) {
    console.error('Redis error or DB error:', error);
    next(error);
  }
});


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
