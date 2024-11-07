require ('dotenv').config();
const { createWorker } = require('tesseract.js');
const { astellen} = require('klassijs-astellen');

const envName = env.envName.toLowerCase();

async function ocrGetText(visualBaseline) {
const browserName = astellen.get('BROWSER_NAME');
  let worker = await createWorker();
  const imagePath = 'artifacts/visual-regression/original/' + browserName + '/' + envName + '/positive/';
  const {
    data: { text },
  } = await worker.recognize(imagePath + visualBaseline);
  console.log( ' ================== ', text);
  await worker.terminate();
}

module.exports = { ocrGetText };
