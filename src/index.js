const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const ejs = require('ejs');

// Config
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs')
app.set('views', './src/views')

const PORT = process.env.PORT || 8080;

// Routes

app.get('/', async (req, res) => {
  const sql = 'SELECT * FROM user';
  try {
    const users = [{
      id: 1,
      name: 'John Doe',
      email: 'johnDoe@email.com'
    },
    {
      id: 2,
      name: 'Jane Doe',
      email: 'janeDoe@email.com',
  }];

    const html = await ejs.renderFile('./src/views/home.ejs', { users }, { async: true });
    //const users = await connection.query(sql);
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
