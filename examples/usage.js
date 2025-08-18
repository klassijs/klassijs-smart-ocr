const { 
  extractText,
  extractLinks,
  makeLinksClickable,
  batchExtract
} = require('../index');

async function demonstrateCapabilities() {
  console.log('🚀 SmartOCR Enhanced Capabilities Demo\n');

  try {
    // 1. Check supported formats by testing file types
    console.log('📋 File Type Support Examples:\n');

    // 2. Extract text from different file types using ONE function
    console.log('📄 Universal Text Extraction Examples:\n');

    // Example with an image (you'll need to provide actual file paths)
    try {
      const imageResult = await extractText('./sample-image.jpg');
      console.log('🖼️  Image Text Extraction:');
      console.log(`   Text: ${imageResult.text.substring(0, 100)}...`);
      console.log(`   Links found: ${imageResult.links.length}`);
      console.log(`   MIME type: ${imageResult.mimeType}\n`);
    } catch (error) {
      console.log('🖼️  Image example skipped (file not found)\n');
    }

    // Example with a PDF
    try {
      const pdfResult = await extractText('./sample-document.pdf');
      console.log('📕 PDF Text Extraction:');
      console.log(`   Text: ${pdfResult.text.substring(0, 100)}...`);
      console.log(`   Links found: ${pdfResult.links.length}`);
      console.log(`   MIME type: ${pdfResult.mimeType}\n`);
    } catch (error) {
      console.log('📕 PDF example skipped (file not found)\n');
    }

    // Example with a DOCX file
    try {
      const docxResult = await extractText('./sample-document.docx');
      console.log('📘 DOCX Text Extraction:');
      console.log(`   Text: ${docxResult.text.substring(0, 100)}...`);
      console.log(`   Links found: ${docxResult.links.length}`);
      console.log(`   MIME type: ${docxResult.mimeType}\n`);
    } catch (error) {
      console.log('📘 DOCX example skipped (file not found)\n');
    }

    // Example with an Excel file
    try {
      const excelResult = await extractText('./sample-spreadsheet.xlsx');
      console.log('📊 Excel Text Extraction:');
      console.log(`   Text: ${excelResult.text.substring(0, 100)}...`);
      console.log(`   Links found: ${excelResult.links.length}`);
      console.log(`   MIME type: ${excelResult.mimeType}\n`);
    } catch (error) {
      console.log('📊 Excel example skipped (file not found)\n');
    }

    // 3. Link detection and making them clickable
    console.log('🔗 Link Detection & Clickable Links:\n');
    
    const sampleText = `
      Check out our website at https://example.com for more information.
      Contact us at info@example.com or call +1-555-1234.
      Download files from /downloads/important-document.pdf
      Visit our blog at https://blog.example.com
    `;

    const links = extractLinks(sampleText);
    console.log('   Detected Links:');
    links.forEach((link, index) => {
      console.log(`   ${index + 1}. ${link}`);
    });

    const clickableText = makeLinksClickable(sampleText, links);
    console.log('\n   Clickable HTML Output:');
    console.log('   ' + clickableText.replace(/\n/g, '\n   '));
    console.log('');

    // 4. Batch processing example
    console.log('⚡ Batch Processing Example:\n');
    
    const sampleFiles = [
      './sample-image.jpg',
      './sample-document.pdf',
      './sample-document.docx'
    ];

    console.log('   Processing multiple files...');
    const batchResults = await batchExtract(sampleFiles);
    
    batchResults.forEach((result, index) => {
      if (result.error) {
        console.log(`   File ${index + 1}: Error - ${result.error}`);
      } else {
        console.log(`   File ${index + 1}: ${result.mimeType} - ${result.links.length} links found`);
      }
    });
    console.log('');

    // 5. Efficiency features
    console.log('⚡ Efficiency Features:\n');
    console.log('   - Internal singleton worker pattern prevents recreation');
    console.log('   - Batch processing with Promise.all');
    console.log('   - Automatic MIME type detection');
    console.log('   - Memory-efficient streaming for large files');
    console.log('   - ONE function handles ALL file types automatically!');
    console.log('   - File type validation happens automatically - no user interaction needed!');
    console.log('   - Resource management is completely automatic - no cleanup needed!');
    console.log('');

    // 6. File type support demonstration
    console.log('🔍 File Type Support:\n');
    console.log('   SmartOCR automatically supports:');
    console.log('   - Images: JPEG, PNG, GIF, BMP, TIFF, WebP');
    console.log('   - Documents: PDF, DOCX, RTF, TXT, MD');
    console.log('   - Spreadsheets: XLSX, XLS, CSV');
    console.log('   - Web files: HTML');
    console.log('   - And more! File type detection is automatic.');

    console.log('\n🎯 Key Benefits:');
    console.log('   - Use extractText() for ANY file type');
    console.log('   - No need to remember different function names');
    console.log('   - No need to check file support manually');
    console.log('   - File type validation happens automatically');
    console.log('   - Resource management is completely automatic');

  } catch (error) {
    console.error('❌ Error during demonstration:', error.message);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateCapabilities().catch(console.error);
}

module.exports = { demonstrateCapabilities };
