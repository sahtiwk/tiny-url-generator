const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrls');
const app = express();

// Connection resiliency
const connectDB = async () => {
  try {
    // SECURITY WARNING: Hardcoded secrets should be avoided. Use process.env.MONGO_URI for production.
    const dbURI = process.env.MONGO_URI || "mongodb+srv://sahtiwk:Samagnya9@tinycluster.kybmsvj.mongodb.net/?appName=tinycluster";

    const conn = await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 5000 // Fail faster if no connection
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Check and seed database if empty
    const count = await ShortUrl.countDocuments();
    if (count === 0) {
      await ShortUrl.create({
        full: 'https://youtu.be/dQw4w9WgXcQ?si=5D4wGw_psazNtcZn'
      });
      console.log('Database seeded with default URL.');
    }
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    // Don't exit process in serverless, but log heavily
  }
};

// Connect immediately
connectDB();

// Handle interaction before connection is ready
mongoose.connection.on('error', err => {
  console.error('Mongoose connection error:', err);
});


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
  shortUrl.save();
  res.redirect(shortUrl.full);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;