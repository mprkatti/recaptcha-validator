const { json } = require('express');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const axios = require('axios');

const config = require('./config');

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const feedback = [];
const qrcodeDB = [];

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
    res.status(200).json(response.data);

  }).catch((error) => {
    console.log('Inside error blk');
    res.status(500).json({ "message": "internal error" });
  })


});

const getQrCode = (secret) => {
  let result = '';
  result = qrcode.toDataURL(secret.otpauth_url, { errorCorrectionLevel: 'M' });

  return result;

}

app.post('/qrcode', (req, res) => {

  const { name } = req.body;
  let entry = qrcodeDB.find(el => el.name === name);

  if (entry) {

    let json_object = {
      status: 1,
      description: 'Already Registered',
      qr_data: entry.qr_data
    };

    res.json({ "response": json_object });
    return;

  }

  const secret = speakeasy.generateSecret({ name: name });
  console.log(secret);

  getQrCode(secret).then(qr_data => {
    let response_object = {
      status: 2,
      description: 'Success',
      qr_data
    };
    qrcodeDB.push({ name, secret, qr_data });
    res.json({ "response": response_object });
  }).catch(err => {
    console.log(err);
  });



});

app.post('/verify', (req, res) => {

  const { token, name } = req.body;
  const entry = qrcodeDB.find(el => el.name === name);
  const verified = speakeasy.totp.verify({
    secret: entry.secret.base32,
    encoding: 'base32',
    token
  });

  console.log(verified);
  res.status(200).json({ verified });

});

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});
