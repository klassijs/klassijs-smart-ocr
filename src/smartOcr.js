require('dotenv').config();
const { createWorker } = require('tesseract.js');
const { astellen } = require('klassijs-astellen');
const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const csvParser = require('csv-parser');
const { parse } = require('node-html-parser');

let _worker = null;
let _workerPromise = null;

// Internal helper functions
async function getWorker() {
  if (!_worker) {
    if (!_workerPromise) {
      _workerPromise = createWorker();
    }
    _worker = await _workerPromise;
  }
  return _worker;
}

function getSupportedFormats() {
  return {
    // Image formats
    'image/jpeg': extractTextFromImage,
    'image/jpg': extractTextFromImage,
    'image/png': extractTextFromImage,
    'image/gif': extractTextFromImage,
    'image/bmp': extractTextFromImage,
    'image/tiff': extractTextFromImage,
    'image/webp': extractTextFromImage,
    
    // Document formats
    'application/pdf': extractTextFromPDF,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractTextFromDocx,
    'application/vnd.ms-excel': extractTextFromExcel,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': extractTextFromExcel,
    'text/csv': extractTextFromCSV,
    'text/html': extractTextFromHTML,
    'text/plain': extractTextFromText,
    
    // Additional formats
    'application/rtf': extractTextFromRTF,
    'text/markdown': extractTextFromText
  };
}

// Main text extraction function - handles ALL file types automatically
async function extractText(filePath, options = {}) {
  try {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const supportedFormats = getSupportedFormats();
    const extractor = supportedFormats[mimeType];

    if (!extractor) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const text = await extractor(filePath);
    
    // Ensure text is a string
    const safeText = typeof text === 'string' ? text : String(text || '');
    
    // Extract links safely
    let links = [];
    try {
      links = extractLinks(safeText);
    } catch (error) {
      console.warn('Error extracting links:', error.message);
      links = [];
    }
    
    // Save links to JSON if requested
    let savedJsonPath = null;
    if (options.saveLinksToJson !== false) { // Default to true
      try {
        savedJsonPath = await saveLinksToJson(links, filePath, options.outputDir);
      } catch (error) {
        console.warn('Failed to save links to JSON:', error.message);
      }
    }
    
    return {
      text: safeText,
      mimeType,
      links,
      filePath,
      savedLinksJson: savedJsonPath
    };
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error.message);
    throw error;
  }
}

async function extractTextFromImage(imagePath) {
  const worker = await getWorker();
  const { data: { text } } = await worker.recognize(imagePath);
  return text;
}

async function extractTextFromPDF(pdfPath) {
  const dataBuffer = await fs.readFile(pdfPath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

async function extractTextFromDocx(docxPath) {
  const result = await mammoth.extractRawText({ path: docxPath });
  return result.value;
}

async function extractTextFromExcel(excelPath) {
  const workbook = XLSX.readFile(excelPath);
  let text = '';
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const sheetText = XLSX.utils.sheet_to_txt(sheet);
    text += `Sheet: ${sheetName}\n${sheetText}\n\n`;
  });
  
  return text;
}

async function extractTextFromCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const text = results.map(row => Object.values(row).join(', ')).join('\n');
        resolve(text);
      })
      .on('error', reject);
  });
}

async function extractTextFromHTML(htmlPath) {
  const htmlContent = await fs.readFile(htmlPath, 'utf-8');
  const root = parse(htmlContent);
  return root.text;
}

async function extractTextFromText(textPath) {
  return await fs.readFile(textPath, 'utf-8');
}

async function extractTextFromRTF(rtfPath) {
  const content = await fs.readFile(rtfPath, 'utf-8');
  // Basic RTF text extraction - remove RTF markup
  return content.replace(/\{\\rtf1[^}]*\}/g, '')
                .replace(/\\[a-z]+\d*\s?/g, '')
                .replace(/[{}]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
}

// Extract links from text using regex patterns
function extractLinks(text) {
  // Validate input
  if (typeof text !== 'string') {
    console.warn('extractLinks: text parameter is not a string, defaulting to empty string');
    text = String(text || '');
  }
  
  const linkPatterns = [
    /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
    // Email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    /(?<!https?:)\/[^\s<>"{}|\\^`\[\]]+/gi
  ];

  const links = new Set();
  
  try {
    linkPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanLink = match.replace(/[.,;!?]+$/, '');
          if (cleanLink.length > 3) { 
            if (!links.has(cleanLink) && !links.has(cleanLink.replace(/^\/+/, ''))) {
              links.add(cleanLink);
            }
          }
        });
      }
    });
  } catch (error) {
    console.warn('Error processing link patterns:', error.message);
  }

  return Array.from(links);
}

// Save links to a JSON file for later use in tests
async function saveLinksToJson(links, filePath, outputDir = './extracted-links') {
  try {
    // Create output directory if it doesn't exist
    await fs.ensureDir(outputDir);
    
    // Generate filename based on original file
    const baseName = path.basename(filePath, path.extname(filePath));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFileName = `${baseName}_links_${timestamp}.json`;
    const jsonFilePath = path.join(outputDir, jsonFileName);
    
    // Prepare data to save
    const linkData = {
      originalFile: filePath,
      extractedAt: new Date().toISOString(),
      totalLinks: links.length,
      links: links.map((link, index) => ({
        id: index + 1,
        url: link,
        type: link.includes('@') ? 'email' : 
              link.startsWith('http') ? 'url' : 
              link.startsWith('/') ? 'file-path' : 'other'
      }))
    };
    
    // Save to JSON file
    await fs.writeJson(jsonFilePath, linkData, { spaces: 2 });
    
    console.log(`✅ Links saved to: ${jsonFilePath}`);
    console.log(`   Total links: ${links.length}`);
    
    return jsonFilePath;
  } catch (error) {
    console.error('Error saving links to JSON:', error.message);
    throw error;
  }
}

function makeLinksClickable(text, links) {
  let clickableText = text;
  
  // Validate that links is an array
  if (!Array.isArray(links)) {
    console.warn('makeLinksClickable: links parameter is not an array, defaulting to empty array');
    links = [];
  }
  
  const sortedLinks = [...links].sort((a, b) => b.length - a.length);
  
  sortedLinks.forEach(link => {
    let displayText = link;
    let href = link;
    
    if (link.includes('@')) {
      href = `mailto:${link}`;
    }
   
    else if (link.startsWith('/') && !link.startsWith('//')) {
      href = `file://${link}`;
    }
    
    else if (link.startsWith('./') || link.startsWith('../')) {
      href = link;
    }
    
    const linkHtml = `<a href="${href}" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
    // Use word boundary to avoid partial matches
    const regex = new RegExp(`\\b${link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    clickableText = clickableText.replace(regex, linkHtml);
  });
  
  return clickableText;
}

function isSupported(filePath) {
  const mimeType = mime.lookup(filePath);
  const supportedFormats = getSupportedFormats();
  return mimeType && supportedFormats[mimeType];
}

async function batchExtract(filePaths) {
  const results = [];
  const promises = filePaths.map(async (filePath) => {
    try {
      const result = await extractText(filePath);
      results.push(result);
      return result;
    } catch (error) {
      console.error(`Failed to process ${filePath}:`, error.message);
      results.push({ error: error.message, filePath });
      return null;
    }
  });

  await Promise.all(promises);
  return results;
}

async function cleanup() {
  if (_worker) {
    await _worker.terminate();
    _worker = null;
    _workerPromise = null;
  }
}

module.exports = { 
  extractText,
  extractLinks,
  makeLinksClickable,
  batchExtract,
  saveLinksToJson
};
