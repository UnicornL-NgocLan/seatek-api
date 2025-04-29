const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  authenticateEmployeeKey,
} = require("../middlewares/checkForEmployeeApiKey");
const fileProcessCtrl = require("../controllers/fileProcess");

// configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure 'uploads/' folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// initialize upload middleware
const upload = multer({ storage: storage });

router.post(
  "/get-extract-pdf-data",
  authenticateEmployeeKey,
  upload.single("file"),
  fileProcessCtrl.extractTextFromPdf
);

module.exports = router;
