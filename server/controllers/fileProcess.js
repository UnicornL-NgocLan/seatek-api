const pdfParse = require("pdf-parse");
const { extractPdfImageFromOCR } = require("../utils/ocrProcess.js");
const fs = require("fs");

const fileProcessCtrl = {
  extractTextFromPdf: async (req, res) => {
    try {
      if (!req.file) return res.status(400).send("No file uploaded!");
      let result = "";
      // Extract text from PDF buffer
      const buffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(buffer);
      if (data.text.trim()) {
        result = data.text;
      } else {
        result = await extractPdfImageFromOCR(buffer);
      }
      // Send extracted text as response
      res.send({
        extractedText: result,
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    } finally {
      // ❗ Cleanup: remove file after processing
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
        else console.log("Temporary file deleted.");
      });
    }
  },
};

module.exports = fileProcessCtrl;
