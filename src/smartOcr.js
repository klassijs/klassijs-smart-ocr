require ('dotenv').config();
const { createWorker } = require('tesseract.js');
const { astellen} = require('klassijs-astellen');

const envName = env.envName.toLowerCase();

async function extractTextFromImage(visualBaseline) {
const browserName = astellen.get('BROWSER_NAME');
  let worker = await createWorker();
  const imagePath = 'artifacts/visual-regression/original/' + browserName + '/' + envName + '/positive/' || 'path/to/image.jpg';
  const {
    data: { text },
  } = await worker.recognize(imagePath + visualBaseline);
  console.log( ' ================== ', text);
  await worker.terminate();
}

async function extractTextFromPDF(pdfFilePath, pdfFileName) {
  let worker = await createWorker();
  pdfFilePath = 'path/to/document.pdf';
  const {
    data: { text },
  } = await worker.recognize(pdfFilePath + pdfFileName);
  console.log( ' ================== ', text);
  await worker.terminate();
}

async function ocrGetLink(fileName) {
  let worker = await createWorker();
  const filePath = 'path/to/image-pdf';
  // TODO: fuzzy logic to determine is there are links in the text and return them
  const {
    data: { link },
  } = await worker.recognize(filePath + fileName);
  console.log( ' ================== ', link);
  await worker.terminate();
}

module.exports = { extractTextFromImage, extractTextFromPDF, ocrGetLink };
