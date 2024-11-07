
const { createWorker } = require('tesseract.js');

async function ocrReadTExt(visualBaseline) {
  let worker = await createWorker();
  const imagePath = 'artifacts/visual-regression/original/' + browserName + '/' + envName + '/positive/';
  const {
    data: { text },
  } = await worker.recognize(imagePath + visualBaseline);
  console.log( ' ================== ', text);
  await worker.terminate();
}

module.exports = { ocrReadTExt };
