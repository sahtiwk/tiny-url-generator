const express = require('express');
const ShortUrl = require('./models/shortUrls');
const dbConnect = require('./utils/db');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', async (req, res) => {
  await dbConnect();
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls });
});

app.post('/shortUrls', async (req, res) => {
  await dbConnect();
  await ShortUrl.create({ full: req.body.fullUrl });
  res.redirect('/');
});

app.get('/:shortUrl', async (req, res) => {
  await dbConnect();
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (!shortUrl) return res.sendStatus(404);
  shortUrl.clicks++;
  await shortUrl.save();
  res.redirect(shortUrl.full);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
