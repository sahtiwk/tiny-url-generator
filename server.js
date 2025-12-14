const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrls');
const app = express();

// Database Connection
const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
  .then(async () => {
    console.log('MongoDB Connected');

    // Seed default data if empty
    const count = await ShortUrl.countDocuments();
    if (count === 0) {
      await ShortUrl.create({ full: 'https://youtu.be/dQw4w9WgXcQ?si=5D4wGw_psazNtcZn' });
      console.log('Database seeded.');
    }
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls: shortUrls });
});

app.post('/shortUrls', async (req, res) => {
  await ShortUrl.create({ full: req.body.fullUrl });
  res.redirect('/');
});

app.get('/:shortUrl', async (req, res) => {
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