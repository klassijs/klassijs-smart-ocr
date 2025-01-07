# klassijs SmartOCR

SmartOCR is a powerful OCR (Optical Character Recognition) module designed for text extraction and interaction. It enables you to extract text from PDFs and images seamlessly and even interact with links embedded in those documents.

---

## Features
- **Text Extraction**: Extract text from images and PDF files with high accuracy.
- **Interactive Links**: Detect and interact with clickable links in PDFs and images.
- **Multi-Format Support**: Compatible with a variety of image formats (e.g., PNG, JPEG) and PDF files.
- **Efficient Processing**: Optimized for speed and scalability in OCR operations.

---

## Installation
Install SmartOCR via pnpm:

```bash
pnpm add klassijs-smart-ocr
```

---

## Usage
Here is an example to get started with SmartOCR:

```javascript
const SmartOCR = require('klassijs-smart-ocr');

(async () => {
    const ocr = new SmartOCR();

    // Extract text from an image
    const text = await ocr.extractTextFromImage('path/to/image.jpg');
    console.log('Extracted Text:', text);

    // Extract text from a PDF
    const pdfText = await ocr.extractTextFromPDF('path/to/document.pdf');
    console.log('Extracted PDF Text:', pdfText);

    // Detect and click links in an image
    const links = await ocr.getLinksFromImage('path/to/image.jpg');
    console.log('Detected Links:', links);

    if (links.length > 0) {
        const result = await ocr.clickLink(links[0]);
        console.log('Link Click Result:', result);
    }
})();
```

---

## API Reference

### `extractTextFromImage(imagePath)`
Extracts text from a given image.
- **Parameters:**
    - `imagePath` *(string)*: Path to the image file.
- **Returns:**
    - *(Promise<string>)* Extracted text.

### `extractTextFromPDF(pdfPath)`
Extracts text from a given PDF file.
- **Parameters:**
    - `pdfPath` *(string)*: Path to the PDF file.
- **Returns:**
    - *(Promise<string>)* Extracted text.

### `getLinksFromImage(imagePath)`
Detects clickable links within an image.
- **Parameters:**
    - `imagePath` *(string)*: Path to the image file.
- **Returns:**
    - *(Promise<string[]>)* Array of detected links.

### `getLinksFromPDF(pdfPath)`
Detects clickable links within a PDF file.
- **Parameters:**
    - `pdfPath` *(string)*: Path to the PDF file.
- **Returns:**
    - *(Promise<string[]>)* Array of detected links.

### `clickLink(link)`
Simulates a click on the given link.
- **Parameters:**
    - `link` *(string)*: URL to interact with.
- **Returns:**
    - *(Promise<object>)* Result of the interaction.

---

## Requirements
- Node.js 14 or later
- Dependencies:
    - `tesseract.js` (for OCR)
    - `pdf-lib` (for PDF parsing)

---

## Contributing
Contributions are welcome! If you have ideas for improvements or new features, feel free to open an issue or submit a pull request.

1. Fork the repository.
2. Create a new branch.
3. Make your changes and commit them.
4. Submit a pull request.

---

## License
SmartOCR is open-source software licensed under the [MIT License](LICENSE).

---

## Acknowledgments
Special thanks to the developers of `tesseract.js` and `pdf-lib` for making OCR and PDF processing seamless.

