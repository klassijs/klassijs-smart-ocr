#!/usr/bin/env node

const { 
  extractText, 
  extractLinks, 
  makeLinksClickable, 
  batchExtract, 
  saveLinksToJson, 
  loadLinksFromJson, 
  extractStructuredData,
  // WebdriverIO-style OCR functions
  ocrGetText,
  ocrGetElementPositionByText,
  ocrWaitForTextDisplayed,
  ocrClickOnText,
  ocrSetValue,
  ocrBatchOperations,
  // Utility functions
  fuzzyMatch,
  findTextPosition,
  waitForText,
  // Oxford Test specific functions
  extractOxfordTestStructuredData
} = require('./src/smartOcr');

const fs = require('fs-extra');
const path = require('path');

// Create ocrExtractedContent folder if it doesn't exist
const outputDir = './ocrExtractedContent';
fs.ensureDirSync(outputDir);

function showHelp() {
  console.log(`
🔍 Klassijs Smart OCR CLI Tool

Usage: node cli.js <command> [options]

Commands:
  extract <file>                    Extract text from a file
  links <file>                      Extract links from a file
  batch <folder>                    Batch extract from all files in a folder
  save-links <file>                 Save extracted links to JSON
  load-links <json-file>            Load links from JSON file
  compare <file1> <file2>           Compare structured data between files
  
  // WebdriverIO-style OCR commands
  get-text <image> [options]        Extract all text from image
  find-text <image> <searchText>    Find position of text in image
  wait-for-text <image> <text>      Wait for text to appear in image
  click-on-text <image> <text>      Get click coordinates for text
  set-value <image> <field> <value> Get field position for setting value
  batch <operations.json>           Run multiple OCR operations

Examples:
  node cli.js extract document.pdf
  node cli.js links webpage.html
  node cli.js batch ./documents
  node cli.js save-links document.pdf
  node cli.js load-links links.json
  
  // WebdriverIO-style examples
  node cli.js get-text screenshot.png
  node cli.js find-text screenshot.png "Login"
  node cli.js wait-for-text screenshot.png "Welcome"
  node cli.js click-on-text screenshot.png "Submit"
  node cli.js set-value screenshot.png "Username" "john"
  node cli.js batch operations.json

Options:
  --output-dir <dir>                Output directory for results
  --save-links                     Save links to JSON file
  --confidence <number>            OCR confidence threshold (0-100)
  --language <lang>                OCR language (default: eng)
  --timeout <ms>                   Timeout for wait operations (default: 5000)
  --threshold <number>             Fuzzy match threshold (0-1, default: 0.8)
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'extract':
        if (args.length < 2) {
          console.error('❌ Error: Please provide a file path');
          return;
        }
        const filePath = args[1];
        console.log(`🔍 Extracting text from: ${filePath}`);
        const result = await extractText(filePath);
        
        // Save extracted content to ocrExtractedContent folder
        const now = new Date();
        const dateTimeStr = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const baseName = path.basename(filePath, path.extname(filePath));
        const outputFile = path.join(outputDir, `extracted_content_${baseName}_${dateTimeStr}.txt`);
        
        let content = `EXTRACTED CONTENT FROM: ${filePath}\n`;
        content += `Extracted at: ${now.toISOString()}\n`;
        content += `══════════════════════════════════════════════════\n\n`;
        
        if (result.structuredData) {
          content += `STRUCTURED DATA EXTRACTED:\n`;
          content += `─────────────────────────\n\n`;
          content += `TEST TAKER INFORMATION:\n`;
          content += `Name: ${result.structuredData.testTaker?.name || 'NOT FOUND'}\n`;
          content += `Date of Birth: ${result.structuredData.testTaker?.dateOfBirth || 'NOT FOUND'}\n`;
          content += `Test Taker Number: ${result.structuredData.testTaker?.number || 'NOT FOUND'}\n`;
          content += `Certificate Reference: ${result.structuredData.testTaker?.certificateRef || 'NOT FOUND'}\n\n`;
          content += `TEST RESULTS:\n`;
          content += `Speaking: ${result.structuredData.testResults?.speaking?.score || 'null'} (03 June 2025)\n`;
          content += `Listening: ${result.structuredData.testResults?.listening?.score || 'null'} (03 June 2025)\n`;
          content += `Reading: ${result.structuredData.testResults?.reading?.score || 'null'} (03 June 2025)\n`;
          content += `Writing: ${result.structuredData.testResults?.writing?.score || 'null'} (03 June 2025)\n\n`;
          content += `OVERALL RESULTS:\n`;
          content += `Overall Score: ${result.structuredData.overallResults?.score || 'NOT FOUND'}\n`;
          content += `CEFR Level: ${result.structuredData.overallResults?.cefrLevel || 'NOT FOUND'}\n\n`;
          content += `══════════════════════════════════════════════════\n\n`;
        }
        
        content += `COMPLETE TEXT CONTENT FROM PDF:\n`;
        content += `─────────────────────────────────\n\n`;
        content += result.text;
        
        await fs.writeFile(outputFile, content, 'utf-8');
        console.log(`✅ Text extracted and saved to: ${outputFile}`);
        console.log(`📄 Text length: ${result.text.length} characters`);
        if (result.structuredData) {
          console.log(`🔍 Structured data extracted successfully`);
        }
        break;

      case 'links':
        if (args.length < 2) {
          console.error('❌ Error: Please provide a file path');
          return;
        }
        const linksFilePath = args[1];
        console.log(`🔍 Extracting links from: ${linksFilePath}`);
        const linksResult = await extractText(linksFilePath);
        const links = extractLinks(linksResult.text);
        console.log(`✅ Found ${links.length} links`);
        links.forEach((link, index) => {
          console.log(`   ${index + 1}: ${link}`);
        });
        break;

      case 'batch':
        if (args.length < 2) {
          console.error('❌ Error: Please provide a folder path');
          return;
        }
        const folderPath = args[1];
        console.log(`🔍 Batch extracting from folder: ${folderPath}`);
        const batchResults = await batchExtract(folderPath);
        console.log(`✅ Processed ${batchResults.length} files`);
        break;

      case 'save-links':
        if (args.length < 2) {
          console.error('❌ Error: Please provide a file path');
          return;
        }
        const saveLinksFilePath = args[1];
        console.log(`🔍 Saving links from: ${saveLinksFilePath}`);
        const saveLinksResult = await extractText(saveLinksFilePath);
        const saveLinks = extractLinks(saveLinksResult.text);
        const jsonPath = await saveLinksToJson(saveLinks, saveLinksFilePath);
        console.log(`✅ Links saved to: ${jsonPath}`);
        break;

      case 'load-links':
        if (args.length < 2) {
          console.error('❌ Error: Please provide a JSON file path');
          return;
        }
        const jsonFilePath = args[1];
        console.log(`🔍 Loading links from: ${jsonFilePath}`);
        const loadedLinks = await loadLinksFromJson(jsonFilePath);
        console.log(`✅ Loaded ${loadedLinks.length} links`);
        break;

      // WebdriverIO-style OCR commands
      case 'get-text':
        if (args.length < 2) {
          console.error('❌ Error: Please provide an image path');
          return;
        }
        const getTextImagePath = args[1];
        const options = parseOptions(args.slice(2));
        console.log(`🔍 Getting text from: ${getTextImagePath}`);
        const textResult = await ocrGetText(getTextImagePath, options);
        console.log(`✅ Text extracted:`, textResult);
        break;

      case 'find-text':
        if (args.length < 3) {
          console.error('❌ Error: Please provide image path and search text');
          return;
        }
        const findTextImagePath = args[1];
        const searchText = args[2];
        const findTextOptions = parseOptions(args.slice(3));
        console.log(`🔍 Finding text "${searchText}" in: ${findTextImagePath}`);
        const findTextResult = await ocrGetElementPositionByText(findTextImagePath, searchText, findTextOptions);
        console.log(`✅ Text position:`, findTextResult);
        break;

      case 'wait-for-text':
        if (args.length < 3) {
          console.error('❌ Error: Please provide image path and text to wait for');
          return;
        }
        const waitForTextImagePath = args[1];
        const waitForText = args[2];
        const waitForTextOptions = parseOptions(args.slice(3));
        console.log(`🔍 Waiting for text "${waitForText}" in: ${waitForTextImagePath}`);
        const waitForTextResult = await ocrWaitForTextDisplayed(waitForTextImagePath, waitForText, waitForTextOptions);
        console.log(`✅ Wait result:`, waitForTextResult);
        break;

      case 'click-on-text':
        if (args.length < 3) {
          console.error('❌ Error: Please provide image path and text to click');
          return;
        }
        const clickOnTextImagePath = args[1];
        const clickOnText = args[2];
        const clickOnTextOptions = parseOptions(args.slice(3));
        console.log(`🔍 Getting click coordinates for "${clickOnText}" in: ${clickOnTextImagePath}`);
        const clickOnTextResult = await ocrClickOnText(clickOnTextImagePath, clickOnText, clickOnTextOptions);
        console.log(`✅ Click coordinates:`, clickOnTextResult);
        break;

      case 'set-value':
        if (args.length < 4) {
          console.error('❌ Error: Please provide image path, field text, and value');
          return;
        }
        const setValueImagePath = args[1];
        const fieldText = args[2];
        const value = args[3];
        const setValueOptions = parseOptions(args.slice(4));
        console.log(`🔍 Getting field position for "${fieldText}" in: ${setValueImagePath}`);
        const setValueResult = await ocrSetValue(setValueImagePath, fieldText, value, setValueOptions);
        console.log(`✅ Field position:`, setValueResult);
        break;

      case 'batch':
        if (args.length < 2) {
          console.error('❌ Error: Please provide a JSON file with operations');
          return;
        }
        const batchOperationsFile = args[1];
        const batchOptions = parseOptions(args.slice(2));
        console.log(`🔍 Running batch operations from: ${batchOperationsFile}`);
        const batchOperations = JSON.parse(await fs.readFile(batchOperationsFile, 'utf-8'));
        const batchResult = await ocrBatchOperations(batchOperations, batchOptions);
        console.log(`✅ Batch operations completed:`, batchResult);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        break;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      
      // Parse numeric values
      if (key === 'confidence' || key === 'timeout') {
        options[key] = parseInt(value);
      } else if (key === 'threshold') {
        options[key] = parseFloat(value);
      } else {
        options[key] = value;
      }
    }
  }
  
  return options;
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, showHelp };
