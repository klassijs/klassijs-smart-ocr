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

// Internal singleton instance - not exported
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
async function extractText(filePath) {
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
    return {
      text,
      mimeType,
      links: extractLinks(text),
      filePath
    };
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error.message);
    throw error;
  }
}

// Internal extraction functions (not exported)
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
  const linkPatterns = [
    // URLs (more specific to avoid duplicates)
    /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
    // Email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    // File paths (basic) - but not URLs
    /(?<!https?:)\/[^\s<>"{}|\\^`\[\]]+/gi
  ];

  const links = new Set();
  
  linkPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up the link
        const cleanLink = match.replace(/[.,;!?]+$/, '');
        if (cleanLink.length > 3) { // Minimum length check
          // Avoid adding duplicate patterns
          if (!links.has(cleanLink) && !links.has(cleanLink.replace(/^\/+/, ''))) {
            links.add(cleanLink);
          }
        }
      });
    }
  });

  return Array.from(links);
}

// Make links clickable by wrapping them in HTML
function makeLinksClickable(text, links) {
  let clickableText = text;
  
  // Sort links by length (longest first) to avoid partial replacements
  const sortedLinks = [...links].sort((a, b) => b.length - a.length);
  
  sortedLinks.forEach(link => {
    let displayText = link;
    let href = link;
    
    // Handle email addresses
    if (link.includes('@')) {
      href = `mailto:${link}`;
    }
    // Handle file paths
    else if (link.startsWith('/') && !link.startsWith('//')) {
      href = `file://${link}`;
    }
    // Handle relative URLs
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

// Check if a file type is supported
function isSupported(filePath) {
  const mimeType = mime.lookup(filePath);
  const supportedFormats = getSupportedFormats();
  return mimeType && supportedFormats[mimeType];
}

// Batch process multiple files efficiently
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

// Cleanup resources
async function cleanup() {
  if (_worker) {
    await _worker.terminate();
    _worker = null;
    _workerPromise = null;
  }
}

// Export only the essential functions users need
module.exports = { 
  extractText,           // Universal text extraction for ALL file types
  extractLinks,          // Link detection in text
  makeLinksClickable,    // Convert links to clickable HTML
  batchExtract           // Process multiple files
};
