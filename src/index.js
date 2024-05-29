const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const router = require('./routes/routes');
const session = require('express-session');
const path = require('path');

// Config
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.set('view engine', 'ejs')
app.set('views', './src/views')

const PORT = process.env.PORT || 8080;

// Routes
app.use('/', router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
