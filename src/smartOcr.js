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
    
    // Debug: Show text extraction info
    console.log(`📄 Text extraction: ${safeText.length} characters`);
    if (safeText.length < 500) {
      console.log(`📄 Full text: ${safeText}`);
    } else {
      console.log(`📄 Text preview (first 500 chars): ${safeText.substring(0, 500)}...`);
      console.log(`📄 Text preview (last 500 chars): ...${safeText.substring(safeText.length - 500)}`);
    }

    // Extract links safely
    let links = [];
    try {
      links = extractLinks(safeText);
    } catch (error) {
      console.warn('Error extracting links:', error.message);
      links = [];
    }

    // Save links to JSON if requested and links exist
    let savedJsonPath = null;
    if (options.saveLinksToJson !== false && links && links.length > 0) { // Default to true, but only if links exist
      try {
        savedJsonPath = await saveLinksToJson(links, filePath, options.outputDir);
      } catch (error) {
        console.warn('Failed to save links to JSON:', error.message);
      }
    } else if (options.saveLinksToJson !== false) {
      console.log(`⏭️  No links to save for ${path.basename(filePath)}`);
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
  
  // Enhanced OCR settings for better text quality
  const { data: { text } } = await worker.recognize(imagePath, {
    // Language settings
    lang: 'eng',
    
    // OCR Engine settings for better accuracy
    oem: 3, // Default, based on what is available
    psm: 6, // Assume a uniform block of text
    
    // Additional parameters for better text recognition
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}"\'-/@#$%^&*+=<>|\\~`',
    
    // Confidence threshold
    tessedit_min_confidence: 60
  });
  
  return text;
}

// Clean and improve OCR text for CEFR analysis
function cleanTextForCEFR(text) {
  if (typeof text !== 'string') return '';
  
  let cleanedText = text;
  
  // Fix common OCR errors
  const ocrFixes = [
    // Common character misrecognitions
    [/[|]/g, 'I'],           // Vertical bar to I
    [/[0]/g, 'O'],           // Zero to O (context-dependent)
    [/[1]/g, 'l'],           // One to lowercase L
    [/[5]/g, 'S'],           // Five to S
    [/[8]/g, 'B'],           // Eight to B
    [/[`]/g, "'"],           // Backtick to apostrophe
    [/["]/g, '"'],           // Smart quotes
    [/[']/g, "'"],           // Smart apostrophe
    
    // Fix spacing issues
    [/\s+/g, ' '],           // Multiple spaces to single space
    [/\n\s*\n/g, '\n\n'],    // Clean up paragraph breaks
    
      // Fix common word errors
  [/\b([A-Z])\s+([a-z]+)\b/g, '$1$2'], // Fix split words like "T he" -> "The"
  [/\b([a-z]+)\s+([A-Z])\b/g, '$1$2'], // Fix split words like "th e" -> "the"
  
  // Fix punctuation
  [/\s+([.,!?;:])/g, '$1'], // Remove spaces before punctuation
  [/([.,!?;:])\s*([A-Z])/g, '$1 $2'], // Ensure space after punctuation before capital
  
  // Fix date patterns - ensure space between date and following number/text
  [/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})(\d+\.?\d*)/g, '$1 $2'], // "2 Dec 2024" + "4957.7900" -> "2 Dec 2024 4957.7900"
  [/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})([A-Za-z])/g, '$1 $2'], // "2 Dec 2024" + "Smart" -> "2 Dec 2024 Smart"
  
  // Additional fix for specific meter reading pattern
  [/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})(\d{4}\.\d{4})/g, '$1 $2'], // "2 Dec 2024" + "4957.7900" -> "2 Dec 2024 4957.7900"
  ];
  
  // Apply all fixes
  ocrFixes.forEach(([pattern, replacement]) => {
    cleanedText = cleanedText.replace(pattern, replacement);
  });
  
  // Fix sentence boundaries
  cleanedText = cleanedText.replace(/([.!?])\s*([a-z])/g, '$1 $2');
  
  // Fix capitalization at sentence start
  cleanedText = cleanedText.replace(/(^|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  
  return cleanedText.trim();
}

async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);
    
    // Get text from all pages
    let fullText = '';
    if (data.text) {
      fullText = data.text;
    }
    
    // If we have pages, extract text from each page
    if (data.pages && data.pages.length > 0) {
      fullText = data.pages.map(page => page.text || '').join('\n');
    }
    
    // Fallback to raw text if no structured data
    if (!fullText && data.text) {
      fullText = data.text;
    }
    
    console.log(`📄 PDF extracted: ${fullText.length} characters, ${data.numpages || 'unknown'} pages`);
    
    // Fix common PDF extraction spacing issues
    // Fix date patterns where space is missing between date and number
    fullText = fullText.replace(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})(\d{4}\.\d{4})/g, '$1 $2');
    fullText = fullText.replace(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})(\d{4}\.\d{3})/g, '$1 $2');
    fullText = fullText.replace(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})(\d{4}\.\d{2})/g, '$1 $2');
    
    return fullText || 'No text extracted from PDF';
  } catch (error) {
    console.error('Error extracting PDF text:', error.message);
    throw error;
  }
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

  // Only extract links that are likely to be actual clickable elements or important links
  // from the image content, not just any text that looks like a URL
  const linkPatterns = [
    // Full URLs with http/https
    /\bhttps?:\/\/[^\s<>"{}|\\^`\[\]]{8,}\b/gi,
    // Email addresses
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi,
    // Domain names with paths (like citizensadviceplymouth.org.uk/edfe)
    /\b(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9\-_\/]+)?\b/gi,
    // Relative paths
    /\b\/(?:[a-zA-Z0-9\-_\/]+\.(?:html?|php|asp|jsp|js|css|png|jpg|gif|svg|pdf))\b/gi
  ];

  const links = new Set();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  try {
    lines.forEach(line => {
      // Process all lines that might contain links, but be more inclusive
      if (line.length < 200) {
        linkPatterns.forEach(pattern => {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const cleanLink = match.replace(/[.,;!?]+$/, '').trim();
              // Additional validation: ensure it's a reasonable link length and format
              if (cleanLink.length >= 8 && cleanLink.length <= 200) {
                // Filter out common false positives
                if (!isFalsePositive(cleanLink)) {
                  links.add(cleanLink);
                }
              }
            });
          }
        });
      }
    });
  } catch (error) {
    console.warn('Error processing link patterns:', error.message);
  }

  return Array.from(links);
}

// Helper function to filter out false positive links
function isFalsePositive(link) {
  const falsePositives = [
    // Common text that might look like URLs but aren't
    /^[a-z]+\.(?:com|org|net)$/i,  // Single word domains
    /^[a-z]+\.[a-z]+$/i,           // Very short domains
    /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/ // IP addresses (usually not clickable)
  ];
  
  return falsePositives.some(pattern => pattern.test(link));
}

// Save links to a JSON file for later use in tests
async function saveLinksToJson(links, filePath, outputDir = './shared-objects/extracted-links') {
  try {
    // Don't save if there are no links
    if (!links || links.length === 0) {
      console.log(`⏭️  No links found in ${path.basename(filePath)} - skipping JSON save`);
      return null;
    }

    // Create output directory if it doesn't exist
    await fs.ensureDir(outputDir);

    // Generate filename based on original file and test context
    const baseName = path.basename(filePath, path.extname(filePath));
    
    // Create a more organized filename structure for tests
    const jsonFileName = `${baseName}_extracted_links.json`;
    const jsonFilePath = path.join(outputDir, jsonFileName);

    // Prepare enhanced data to save with test-friendly structure
    const linkData = {
      testMetadata: {
        originalFile: filePath,
        extractedAt: new Date().toISOString(),
        searchTerm: extractSearchTermFromFilename(baseName),
        testStage: determineTestStage(baseName)
      },
      linkSummary: {
        totalLinks: links.length,
        linkTypes: categorizeLinks(links)
      },
      links: links.map((link, index) => ({
        id: index + 1,
        url: link,
        type: categorizeLinkType(link),
        clickable: true,
        extractedFrom: baseName
      }))
    };

    // Save to JSON file
    await fs.writeJson(jsonFilePath, linkData, { spaces: 2 });

    console.log(`✅ Links saved to: ${jsonFilePath}`);
    console.log(`   Total links: ${links.length}`);
    console.log(`   Test context: ${linkData.testMetadata.testStage}`);

    return jsonFilePath;
  } catch (error) {
    console.error('Error saving links to JSON:', error.message);
    throw error;
  }
}

// Helper function to extract search term from filename
function extractSearchTermFromFilename(filename) {
  // Extract search term from filenames like "oup_1-0", "mango_1-1", etc.
  const match = filename.match(/^([a-zA-Z]+)_\d+-\d+/);
  return match ? match[1] : 'unknown';
}

// Helper function to determine test stage from filename
function determineTestStage(filename) {
  // Determine stage from filenames like "oup_1-0", "oup_1-1", "oup-results_1-2"
  if (filename.includes('results')) return 'search_results';
  if (filename.includes('1-0')) return 'initial_page';
  if (filename.includes('1-1')) return 'search_input';
  if (filename.includes('1-2')) return 'search_results';
  return 'unknown_stage';
}

// Helper function to categorize links by type
function categorizeLinks(links) {
  const categories = {
    urls: 0,
    emails: 0,
    filePaths: 0,
    relative: 0,
    other: 0
  };
  
  links.forEach(link => {
    const type = categorizeLinkType(link);
    switch (type) {
      case 'url': categories.urls++; break;
      case 'email': categories.emails++; break;
      case 'file-path': categories.filePaths++; break;
      case 'relative': categories.relative++; break;
      default: categories.other++; break;
    }
  });
  
  return categories;
}

// Helper function to categorize individual link type
function categorizeLinkType(link) {
  if (link.includes('@')) return 'email';
  if (link.startsWith('http')) return 'url';
  if (link.startsWith('/') && !link.startsWith('//')) return 'file-path';
  if (link.startsWith('./') || link.startsWith('../')) return 'relative';
  // Check for domain patterns (like citizensadviceplymouth.org.uk/edfe)
  if (/^[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9\-_\/]+)?$/.test(link)) {
    return 'url';
  }
  return 'other';
}

// Load previously saved links from JSON file for use in tests
async function loadLinksFromJson(searchTerm, testStage, outputDir = './shared-objects/extracted-links') {
  try {
    // Find the most recent JSON file for the given search term and stage
    const files = await fs.readdir(outputDir);
    const matchingFiles = files.filter(file => 
      file.includes(searchTerm) && 
      file.includes('extracted_links.json')
    );
    
    if (matchingFiles.length === 0) {
      console.log(`No saved links found for search term: ${searchTerm}`);
      return null;
    }
    
    // Get the most recent file (by creation time)
    const filePaths = matchingFiles.map(file => path.join(outputDir, file));
    const fileStats = await Promise.all(
      filePaths.map(async (filePath) => ({
        path: filePath,
        stats: await fs.stat(filePath)
      }))
    );
    
    const mostRecent = fileStats.reduce((latest, current) => 
      current.stats.mtime > latest.stats.mtime ? current : latest
    );
    
    const linkData = await fs.readJson(mostRecent.path);
    console.log(`✅ Links loaded from: ${mostRecent.path}`);
    console.log(`   Search term: ${linkData.testMetadata.searchTerm}`);
    console.log(`   Test stage: ${linkData.testMetadata.testStage}`);
    console.log(`   Total links: ${linkData.linkSummary.totalLinks}`);
    
    return linkData;
  } catch (error) {
    console.error('Error loading links from JSON:', error.message);
    return null;
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
    else if (link.startsWith('http')) {
      href = link; // Already a full URL
    }
    else if (link.startsWith('/') && !link.startsWith('//')) {
      href = `file://${link}`;
    }
    else if (link.startsWith('./') || link.startsWith('../')) {
      href = link;
    }
    else if (/^[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9\-_\/]+)?$/.test(link)) {
      // Domain-based URLs - add https:// if no protocol
      href = link.startsWith('www.') ? `https://${link}` : `https://${link}`;
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

// Extract and save structured data for easy comparison
async function extractStructuredData(filePath, options = {}) {
  try {
    // Extract text and links
    const result = await extractText(filePath, { saveLinksToJson: false }); // Don't save links twice
    
    // Create structured data object
    const structuredData = {
      metadata: {
        fileName: path.basename(filePath),
        filePath: filePath,
        fileSize: (await fs.stat(filePath)).size,
        extractedAt: new Date().toISOString(),
        mimeType: result.mimeType,
        totalCharacters: result.text.length,
        totalLines: result.text.split('\n').length,
        totalWords: result.text.split(/\s+/).filter(word => word.length > 0).length
      },
      content: {
        fullText: result.text,
        textByLines: result.text.split('\n').map((line, index) => ({
          lineNumber: index + 1,
          content: line.trim(),
          length: line.trim().length,
          hasLinks: extractLinks(line).length > 0
        })).filter(line => line.content.length > 0),
        textByParagraphs: result.text.split(/\n\s*\n/).map((para, index) => ({
          paragraphNumber: index + 1,
          content: para.trim(),
          length: para.trim().length,
          lineCount: para.split('\n').length
        })).filter(para => para.content.length > 0)
      },
      links: {
        total: result.links.length,
        byType: categorizeLinks(result.links),
        list: result.links.map((link, index) => ({
          id: index + 1,
          url: link,
          type: categorizeLinkType(link),
          context: findLinkContext(result.text, link)
        }))
      },
      analysis: {
        textDensity: result.text.length / (result.text.split('\n').length || 1),
        averageLineLength: result.text.length / (result.text.split('\n').filter(line => line.trim().length > 0).length || 1),
        linkDensity: result.links.length / (result.text.split(/\s+/).filter(word => word.length > 0).length || 1)
      }
    };
    
    // Save structured data
    const outputDir = options.outputDir || './shared-objects/extracted-data';
    await fs.ensureDir(outputDir);
    
    const baseName = path.basename(filePath, path.extname(filePath));
    const jsonFileName = `${baseName}_structured_data.json`;
    const jsonFilePath = path.join(outputDir, jsonFileName);
    
    await fs.writeJson(jsonFilePath, structuredData, { spaces: 2 });
    
    // Also save as CSV for easy comparison
    const csvFileName = `${baseName}_structured_data.csv`;
    const csvFilePath = path.join(outputDir, csvFileName);
    
    const csvContent = generateCSV(structuredData);
    await fs.writeFile(csvFilePath, csvContent, 'utf-8');
    
    console.log(`✅ Structured data saved to: ${jsonFilePath}`);
    console.log(`📊 CSV data saved to: ${csvFilePath}`);
    
    return {
      jsonPath: jsonFilePath,
      csvPath: csvFilePath,
      data: structuredData
    };
  } catch (error) {
    console.error('Error extracting structured data:', error.message);
    throw error;
  }
}

// Helper function to find context around links
function findLinkContext(text, link, contextLength = 100) {
  const linkIndex = text.indexOf(link);
  if (linkIndex === -1) return '';
  
  const start = Math.max(0, linkIndex - contextLength);
  const end = Math.min(text.length, linkIndex + link.length + contextLength);
  
  return text.substring(start, end).replace(/\n/g, ' ').trim();
}

// Generate CSV from structured data
function generateCSV(structuredData) {
  const lines = [];
  
  // Metadata
  lines.push('Section,Field,Value');
  lines.push(`Metadata,FileName,${structuredData.metadata.fileName}`);
  lines.push(`Metadata,FileSize,${structuredData.metadata.fileSize}`);
  lines.push(`Metadata,ExtractedAt,${structuredData.metadata.extractedAt}`);
  lines.push(`Metadata,TotalCharacters,${structuredData.metadata.totalCharacters}`);
  lines.push(`Metadata,TotalLines,${structuredData.metadata.totalLines}`);
  lines.push(`Metadata,TotalWords,${structuredData.metadata.totalWords}`);
  
  // Links
  lines.push(`Links,Total,${structuredData.links.total}`);
  structuredData.links.list.forEach(link => {
    lines.push(`Link,${link.id},${link.url},${link.type}`);
  });
  
  // Text analysis
  lines.push(`Analysis,TextDensity,${structuredData.analysis.textDensity.toFixed(2)}`);
  lines.push(`Analysis,AverageLineLength,${structuredData.analysis.averageLineLength.toFixed(2)}`);
  lines.push(`Analysis,LinkDensity,${structuredData.analysis.linkDensity.toFixed(4)}`);
  
  return lines.join('\n');
}



module.exports = {
  extractText,
  extractLinks,
  makeLinksClickable,
  batchExtract,
  saveLinksToJson,
  loadLinksFromJson,
  extractStructuredData
};
