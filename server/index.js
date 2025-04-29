require("dotenv").config();
const morgan = require("morgan");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const hpp = require("hpp");

const whitelist = ["https://home.seacorp.vn/", "https://home.seacorp.vn"];

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
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(bodyParser.json({ limit: "1mb", type: "application/json" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100kb" }));
app.use(cors());
app.use(helmet());
app.use(hpp());
app.use(morgan("tiny"));

//Routes
app.use("/api", require("./routes/accountingRoute"));
app.use("/api", require("./routes/employeeRoute"));
app.use("/api", require("./routes/fileProcessRoute"));

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is listening on port", port);
});
