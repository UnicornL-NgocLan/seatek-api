require('dotenv').config()
const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const whitelist = [
  "http://localhost:5000",
  "http://localhost:3000",
  "http://localhost:5000/",
  "http://localhost:3000/",
];

const isOriginAllowed = (origin) => {
  if (whitelist.indexOf(origin) !== -1) {
    return true;
  }
  return false;
};

const corsConfig = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET",
  credentials: true,
};


const app = express();
app.use(express.json());
app.use(bodyParser.json({limit: '1mb', type: 'application/json'}));
app.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));
app.use(cors(corsConfig));
app.use(helmet());
app.use(morgan('tiny'));


//Routes
app.use('/api',require('./routes/accountingRoute'));


const port = process.env.PORT || 5000

app.listen(port, () => {  
  console.log("Server is listening on port", port);
});