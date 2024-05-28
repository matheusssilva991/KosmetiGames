const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const ejs = require('ejs');
const authenticateController = require('./controllers/authenticate');
const userController = require('./controllers/user');

// Config
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))

app.set('view engine', 'ejs')
app.set('views', './src/views')

const PORT = process.env.PORT || 8080;

// Routes
app.use('/', authenticateController);
app.use('/', userController);


app.get('/', async (req, res) => {
  try {
    const html = await ejs.renderFile('./src/views/home.ejs', { users: [] }, { async: true });
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
