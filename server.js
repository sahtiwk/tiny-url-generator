const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrls');
const dbConnect = require('./utils/db');
const app = express();

// Handle interaction before connection is ready
mongoose.connection.on('error', err => {
  console.error('Mongoose connection error:', err);
});


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// Favicon route to suppress error logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', async (req, res) => {
  await dbConnect();
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls: shortUrls });
});

app.post('/shortUrls', async (req, res) => {
  await dbConnect();
  await ShortUrl.create({ full: req.body.fullUrl });
  res.redirect('/');
});

app.get('/:shortUrl', async (req, res) => {
  await dbConnect();
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);
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