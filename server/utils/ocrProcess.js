const Tesseract = require("tesseract.js");
const { PDFiumLibrary } = require("@hyzyla/pdfium");
const fs = require("fs/promises");
const sharp = require("sharp");

async function renderFunction(options) {
  return await sharp(options.data, {
    raw: {
      width: options.width,
      height: options.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

// Use Tesseract OCR on image file
async function extractTextWithOCR(imagePath) {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => console.log(m.status),
    });
    return text;
  } catch (error) {
    throw new Error(`Error extracting text with OCR: ${error.message}`);
  }
}

const extractPdfImageFromOCR = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    throw new Error("Invalid or empty PDF buffer provided.");
  }

  try {
    const library = await PDFiumLibrary.init();
    const document = await library.loadDocument(buffer);

    let content = "";
    for (const page of document.pages()) {
      const image = await page.render({
        scale: 3,
        render: renderFunction, // sharp function to convert raw bitmap data to PNG
      });
      // Save the PNG image to the output folder
      await fs.writeFile(`uploads/${page.number}.png`, Buffer.from(image.data));
      const text = await extractTextWithOCR(`uploads/${page.number}.png`);
      content = content + "\n\n" + text;
      fs.unlink(`uploads/${page.number}.png`, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
        else console.log("Temporary file deleted.");
      });
    }

    document.destroy();
    library.destroy();
    return content;
  } catch (error) {
    throw new Error(`Error converting PDF to images: ${error.message}`);
  }
};

module.exports = { extractPdfImageFromOCR };
