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

#### `extractText(filePath)`
**Universal text extraction for ALL file types** - automatically detects file type and uses appropriate extractor.
- **Parameters:** `filePath` (string) - Path to any supported file
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

---

## 🔍 Link Detection Patterns

The system automatically detects:

- **URLs**: `https://example.com`, `http://localhost:3000`
- **Email Addresses**: `user@domain.com`, `contact+tag@company.co.uk`
- **File Paths**: `/downloads/file.pdf`, `./relative/path.txt`
- **Relative URLs**: `../parent/directory`, `./current/file`

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
- All other open-source contributors

