const { extractText } = require('./index');

async function testExtractText() {
  try {
    console.log('🧪 Testing extractText function...\n');
    
    // Test with the text file we just created
    const result = await extractText('./test.txt');
    
    console.log('✅ extractText function worked successfully!');
    console.log('📄 Extracted text:');
    console.log(result.text);
    console.log('\n🔗 Links found:');
    console.log(result.links);
    console.log('\n📋 MIME type:', result.mimeType);
    console.log('📁 File path:', result.filePath);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExtractText();
