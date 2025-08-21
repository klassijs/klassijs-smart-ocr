# klassijs SmartOCR

SmartOCR is a powerful OCR (Optical Character Recognition) module designed for text extraction and interaction from **ALL file types**. It enables you to extract text from images, PDFs, documents, spreadsheets, and more, with intelligent link detection and clickable link generation.

---

## ✨ Enhanced Features

- **🔄 Universal File Support**: Extract text from images, PDFs, DOCX, Excel, CSV, HTML, RTF, Markdown, and more
- **🔗 Smart Link Detection**: Automatically detect URLs, email addresses, and file paths in extracted text
- **🖱️ Clickable Links**: Convert detected links to clickable HTML with proper formatting
- **⚡ High Performance**: Internal singleton worker pattern, batch processing, and memory-efficient streaming
- **🎯 MIME Type Detection**: Automatic file type recognition and appropriate extraction method
- **📊 Batch Processing**: Process multiple files simultaneously for maximum efficiency
- **🚀 Functional API**: Simple function calls - no classes or instances needed!
- **🎯 One Function Rule**: Use `extractText()` for ANY file type - no need to remember different function names!
- **🤖 WebdriverIO Integration**: Built-in OCR functions for automated testing and web scraping
- **📁 Link Persistence**: Save and load extracted links to/from JSON files
- **🔍 Structured Data Extraction**: Extract structured data from specific document types
- **🎓 Oxford Test Support**: Specialized extraction for Oxford Test documents

---

## 🚀 Supported File Types

| Category | Formats | Extractor |
|----------|---------|-----------|
| **Images** | JPEG, PNG, GIF, BMP, TIFF, WebP | OCR (Tesseract.js) |
| **Documents** | PDF | PDF Parser |
| **Word Processing** | DOCX, RTF | Mammoth.js + Custom |
| **Spreadsheets** | XLSX, XLS | Excel.js |
| **Data Files** | CSV | CSV Parser |
| **Web Files** | HTML | HTML Parser |
| **Text Files** | TXT, MD | Direct Read |

---

## 📦 Installation

Install SmartOCR via pnpm:

```bash
pnpm add klassijs-smart-ocr
```

---

## 🎯 Quick Start

### Universal Text Extraction

```javascript
const { extractText } = require('klassijs-smart-ocr');

// Extract text from ANY supported file type - just call extractText!
const result = await extractText('./document.pdf');        // PDF
const result2 = await extractText('./image.jpg');          // Image
const result3 = await extractText('./spreadsheet.xlsx');   // Excel
const result4 = await extractText('./document.docx');      // Word
const result5 = await extractText('./data.csv');           // CSV
const result6 = await extractText('./webpage.html');       // HTML

// All return the same structure:
console.log('Extracted Text:', result.text);
console.log('Links Found:', result.links);
console.log('File Type:', result.mimeType);
```

### Making Links Clickable

```javascript
const { extractText, makeLinksClickable } = require('klassijs-smart-ocr');

// Extract text and links from any file
const result = await extractText('./webpage.html');

// Convert links to clickable HTML
const clickableText = makeLinksClickable(result.text, result.links);
console.log(clickableText);
```

### Batch Processing

```javascript
const { batchExtract } = require('klassijs-smart-ocr');

// Process multiple files of different types efficiently
const files = ['./image.jpg', './document.pdf', './spreadsheet.xlsx'];
const results = await batchExtract(files);

results.forEach(result => {
  if (result.error) {
    console.log(`Failed: ${result.filePath} - ${result.error}`);
  } else {
    console.log(`Success: ${result.filePath} - ${result.links.length} links`);
  }
});
```

---

## 🔧 API Reference

### Core Functions

#### `extractText(filePath, options = {})`
**Universal text extraction for ALL file types** - automatically detects file type and uses appropriate extractor.
- **Parameters:** 
  - `filePath` (string) - Path to any supported file
  - `options` (object, optional) - Additional options for extraction
- **Returns:** Promise<object> with `{ text, mimeType, links, filePath }`
- **Supported:** Images, PDFs, DOCX, Excel, CSV, HTML, RTF, TXT, MD, and more!

#### `extractLinks(text)`
Detects links in text using intelligent pattern matching.
- **Parameters:** `text` (string) - Text to analyze
- **Returns:** Array of detected links (URLs, emails, file paths)

#### `makeLinksClickable(text, links)`
Converts plain text with links to HTML with clickable links.
- **Parameters:** 
  - `text` (string) - Original text
  - `links` (array) - Array of detected links
- **Returns:** HTML string with clickable links

#### `batchExtract(filePaths)`
Processes multiple files simultaneously.
- **Parameters:** `filePaths` (array) - Array of file paths
- **Returns:** Promise<array> of results

#### `saveLinksToJson(links, filePath, outputDir = './shared-objects/extracted-links')`
Saves extracted links to a JSON file for later use.
- **Parameters:**
  - `links` (array) - Array of links to save
  - `filePath` (string) - Original file path (used for naming)
  - `outputDir` (string, optional) - Output directory for JSON files
- **Returns:** Promise<string> - Path to saved JSON file

#### `loadLinksFromJson(searchTerm, testStage, outputDir = './shared-objects/extracted-links')`
Loads previously saved links from JSON files.
- **Parameters:**
  - `searchTerm` (string) - Search term to find relevant JSON files
  - `testStage` (string) - Test stage identifier
  - `outputDir` (string, optional) - Directory to search for JSON files
- **Returns:** Promise<array> - Array of loaded links

#### `extractStructuredData(filePath, options = {})`
Extracts structured data from documents based on their type.
- **Parameters:**
  - `filePath` (string) - Path to the document
  - `options` (object, optional) - Extraction options
- **Returns:** Promise<object> - Structured data object

### WebdriverIO OCR Functions

#### `ocrGetText(imagePath, options = {})`
Extracts text from an image using OCR.
- **Parameters:**
  - `imagePath` (string) - Path to image file
  - `options` (object, optional) - OCR options
- **Returns:** Promise<string> - Extracted text

#### `ocrGetElementPositionByText(imagePath, searchText, options = {})`
Finds the position of text within an image.
- **Parameters:**
  - `imagePath` (string) - Path to image file
  - `searchText` (string) - Text to search for
  - `options` (object, optional) - Search options
- **Returns:** Promise<object> - Position coordinates

#### `ocrWaitForTextDisplayed(imagePath, searchText, timeout = 10000, options = {})`
Waits for specific text to appear in an image.
- **Parameters:**
  - `imagePath` (string) - Path to image file
  - `searchText` (string) - Text to wait for
  - `timeout` (number, optional) - Timeout in milliseconds
  - `options` (object, optional) - Wait options
- **Returns:** Promise<boolean> - True if text found within timeout

#### `ocrClickOnText(imagePath, searchText, options = {})`
Simulates clicking on text within an image.
- **Parameters:**
  - `imagePath` (string) - Path to image file
  - `searchText` (string) - Text to click on
  - `options` (object, optional) - Click options
- **Returns:** Promise<object> - Click result

#### `ocrSetValue(imagePath, searchText, value, options = {})`
Sets a value in an input field identified by nearby text.
- **Parameters:**
  - `imagePath` (string) - Path to image file
  - `searchText` (string) - Text near the input field
  - `value` (string) - Value to set
  - `options` (object, optional) - Set value options
- **Returns:** Promise<boolean> - Success status

#### `ocrBatchOperations(imagePath, operations, options = {})`
Performs multiple OCR operations in sequence.
- **Parameters:**
  - `imagePath` (string) - Path to image file
  - `operations` (array) - Array of operations to perform
  - `options` (object, optional) - Batch options
- **Returns:** Promise<array> - Results of all operations

### Utility Functions

#### `fuzzyMatch(text, searchTerm, threshold = 0.8)`
Performs fuzzy text matching with configurable threshold.
- **Parameters:**
  - `text` (string) - Text to search in
  - `searchTerm` (string) - Term to search for
  - `threshold` (number, optional) - Similarity threshold (0-1)
- **Returns:** boolean - True if match found

#### `findTextPosition(text, searchTerm)`
Finds the position of text within a larger text block.
- **Parameters:**
  - `text` (string) - Text to search in
  - `searchTerm` (string) - Term to search for
- **Returns:** object - Position information

#### `waitForText(text, searchTerm, timeout = 10000)`
Waits for text to appear in a string.
- **Parameters:**
  - `text` (string) - Text to monitor
  - `searchTerm` (string) - Text to wait for
  - `timeout` (number, optional) - Timeout in milliseconds
- **Returns:** Promise<boolean> - True if text found

### Oxford Test Specific Functions

#### `extractOxfordTestStructuredData(filePath)`
Extracts structured data specifically from Oxford Test documents.
- **Parameters:** `filePath` (string) - Path to Oxford Test document
- **Returns:** Promise<object> - Structured test data including scores, dates, and CEFR levels

---

## 📚 Advanced Examples

### Universal File Processing

```javascript
const { extractText, extractLinks } = require('klassijs-smart-ocr');

// Process any file type with the same function
const fileTypes = [
  './document.pdf',
  './image.jpg', 
  './spreadsheet.xlsx',
  './webpage.html',
  './data.csv'
];

for (const file of fileTypes) {
  try {
    const result = await extractText(file);
    console.log(`${file}: ${result.mimeType} - ${result.links.length} links found`);
  } catch (error) {
    console.log(`${file}: Error - ${error.message}`);
  }
}
```

### Link Analysis and Persistence

```javascript
const { extractText, saveLinksToJson, loadLinksFromJson } = require('klassijs-smart-ocr');

// Extract and save links
const result = await extractText('./document.pdf');
if (result.links.length > 0) {
  const savedPath = await saveLinksToJson(result.links, './document.pdf');
  console.log(`Links saved to: ${savedPath}`);
}

// Load previously saved links
const loadedLinks = await loadLinksFromJson('document', 'test-stage');
console.log(`Loaded ${loadedLinks.length} links`);
```

### WebdriverIO OCR Automation

```javascript
const { ocrGetText, ocrClickOnText, ocrSetValue } = require('klassijs-smart-ocr');

// Extract text from a screenshot
const text = await ocrGetText('./screenshot.png');
console.log('Page text:', text);

// Click on a button by text
await ocrClickOnText('./screenshot.png', 'Submit');

// Fill a form field
await ocrSetValue('./screenshot.png', 'Username:', 'testuser');
```

### Structured Data Extraction

```javascript
const { extractStructuredData, extractOxfordTestStructuredData } = require('klassijs-smart-ocr');

// Extract structured data from any document
const data = await extractStructuredData('./document.pdf');
console.log('Structured data:', data);

// Extract Oxford Test specific data
const oxfordData = await extractOxfordTestStructuredData('./oxford-test.pdf');
console.log('CEFR Level:', oxfordData.overallResults.cefrLevel);
console.log('Overall Score:', oxfordData.overallResults.score);
```

### Batch OCR Operations

```javascript
const { ocrBatchOperations } = require('klassijs-smart-ocr');

// Perform multiple OCR operations
const operations = [
  { type: 'getText', searchText: 'Welcome' },
  { type: 'click', searchText: 'Login' },
  { type: 'setValue', searchText: 'Username:', value: 'user123' }
];

const results = await ocrBatchOperations('./screenshot.png', operations);
console.log('Batch results:', results);
```

### Link Analysis

```javascript
const { extractText, extractLinks } = require('klassijs-smart-ocr');

// Extract text from any document
const result = await extractText('./complex-document.docx');

// Analyze links found
result.links.forEach(link => {
  if (link.includes('@')) {
    console.log('Email found:', link);
  } else if (link.startsWith('http')) {
    console.log('URL found:', link);
  } else if (link.startsWith('/')) {
    console.log('File path found:', link);
  }
});
```

### File Type Validation

```javascript
const { extractText } = require('klassijs-smart-ocr');

const files = ['./image.jpg', './document.pdf', './unknown.xyz'];

files.forEach(async (file) => {
  try {
    const result = await extractText(file);
    console.log(`${file} is supported and processed successfully`);
  } catch (error) {
    console.log(`${file} is not supported or failed to process`);
  }
});
```

### Efficient Batch Processing

```javascript
const { batchExtract } = require('klassijs-smart-ocr');

// Process multiple files of different types
const results = await batchExtract(['./file1.pdf', './file2.docx', './file3.jpg']);
console.log('All files processed successfully');
```

---

## ⚡ Performance Features

- **Internal Singleton Worker**: OCR worker is created once and reused internally
- **Memory Efficient**: Streaming for large files (CSV, etc.)
- **Parallel Processing**: Batch operations use Promise.all
- **Smart Caching**: MIME type detection is cached
- **Automatic Resource Management**: Resources are managed internally - no user cleanup needed!
- **No Instance Creation**: Users just call functions - no overhead!
- **Universal Function**: One `extractText()` function handles ALL file types!
- **Link Persistence**: Save and reload extracted links without reprocessing
- **Structured Data**: Extract meaningful data structures from documents
- **WebdriverIO Ready**: Built-in functions for automated testing workflows

---

## 🔍 Link Detection Patterns

The system automatically detects:

- **URLs**: `https://example.com`, `http://localhost:3000`
- **Email Addresses**: `user@domain.com`, `contact+tag@company.co.uk`
- **File Paths**: `/downloads/file.pdf`, `./relative/path.txt`
- **Relative URLs**: `../parent/directory`, `./current/file`

---

## 🎓 Oxford Test Support

SmartOCR includes specialized support for Oxford Test documents:

- **Automatic Score Extraction**: Reading, Writing, Speaking, and Listening scores
- **CEFR Level Detection**: Automatic CEFR level identification (A1-C2)
- **Date Extraction**: Test and certificate dates
- **Structured Output**: Clean, organized data structure for test results

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or new features, feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a new branch
3. Make your changes and commit them
4. Submit a pull request

---

## 📄 License

SmartOCR is open-source software licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

Special thanks to the developers of:
- `tesseract.js` for OCR capabilities
- `pdf-parse` for PDF processing
- `mammoth` for DOCX support
- `xlsx` for Excel processing
- `klassijs-astellen` for additional functionality
- All other open-source contributors

---

## 📞 Contact & Support

- **Creator**: Larry Goddard
- **Email**: larryg@klassitech.co.uk
- **LinkedIn**: [https://linkedin.com/in/larryg](https://linkedin.com/in/larryg)
- **YouTube**: [https://youtube.com/@LarryG_01](https://youtube.com/@LarryG_01)

For support, feature requests, or contributions, please visit our [GitHub repository](https://github.com/klassijs/klassijs-smart-ocr).

