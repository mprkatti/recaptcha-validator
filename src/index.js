const { json } = require('express');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const axios = require('axios');

const config = require('./config');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const feedback = [];

const port = process.env.PORT || 5000;


app.post('/feedback', (req, res) => {

  const { name, profession, rating, token } = req.body.data;

  if (feedback.find(el => el.name === name)) {
    console.log('feedback already exists ');
    res.status(204).json('success');
    res.end();

  }
  feedback.push({ id: uuid.v4(), name, profession, rating });
  const secret = config.SITE_SECRET;
  const VERIFY_URL = `${config.SITE_VERIFY_BASE_URL}?secret=${secret}&response=${token}`;

  axios.post(VERIFY_URL).then((response) => {
    console.log('reCaptcha response: ', response.data);
  }).catch((error) => {
    console.log('Inside error blk');
  })

  // console.log(feedback);
  res.status(200).json('success');

});

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
})