const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const pdf = require('pdf-parse');
const EPub = require('epub2').EPub;

/**
 * Split text into chunks ~1500 chars long avoiding mid-sentence breaks if possible
 */
function chunkText(text, maxLen = 1500) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (let sentence of sentences) {
    if ((currentChunk.length + sentence.length) > maxLen) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

/**
 * Handle MOBI/PRC to EPUB via Calibre
 */
function convertToEpub(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    exec(`ebook-convert "${inputPath}" "${outputPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Conversion error: ${error.message}`);
        return reject(error);
      }
      resolve(outputPath);
    });
  });
}

/**
 * Extract chapters from EPUB
 */
function parseEpub(filePath) {
  return new Promise((resolve, reject) => {
    EPub.createAsync(filePath)
      .then((epub) => {
        const chapters = [];
        let completed = 0;
        
        epub.flow.forEach((chapterData, index) => {
          epub.getChapter(chapterData.id, (err, text) => {
            if (err) {
              completed++;
              if (completed === epub.flow.length) resolve(chapters);
              return;
            }
            
            // Basic HTML strip
            const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleanText) {
                // if a chapter is too long, chunk it
                if (cleanText.length > 2000) {
                    const chunks = chunkText(cleanText);
                    chunks.forEach((c, idx) => {
                        chapters.push({
                            title: epub.metadata.title + ' - Part ' + (index + 1) + '-' + (idx + 1),
                            text: c
                        });
                    });
                } else {
                    chapters.push({
                      title: epub.metadata.title + ' - Part ' + (index + 1),
                      text: cleanText
                    });
                }
            }
            
            completed++;
            if (completed === epub.flow.length) {
              resolve(chapters);
            }
          });
        });
      })
      .catch(reject);
  });
}

/**
 * Extract from PDF
 */
async function parsePdf(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  const cleanText = data.text.replace(/\s+/g, ' ').trim();
  const chunks = chunkText(cleanText, 1500);
  
  return chunks.map((chunk, index) => ({
    title: `Section ${index + 1}`,
    text: chunk
  }));
}

module.exports = {
  chunkText,
  convertToEpub,
  parseEpub,
  parsePdf
};
