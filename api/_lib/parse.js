const fs = require('fs/promises');

/**
 * Split text into chunks, capped at maxLen characters.
 * Tries to break at sentence boundaries.
 */
function chunkText(text, maxLen = 3800) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current.length + sentence.length) > maxLen) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, maxLen)];
}

/**
 * Parse an EPUB file and return [{title, text}] chapters.
 */
function parseEpub(filePath) {
  return new Promise((resolve, reject) => {
    const { EPub } = require('epub2');
    EPub.createAsync(filePath)
      .then((epub) => {
        const chapters = [];
        let completed = 0;
        const total = epub.flow.length;

        if (total === 0) return resolve([]);

        epub.flow.forEach((chapterData, index) => {
          epub.getChapter(chapterData.id, (err, text) => {
            completed++;
            if (!err && text) {
              const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              if (clean.length > 50) {
                const baseTitle = epub.metadata?.title
                  ? `${epub.metadata.title} — Part ${index + 1}`
                  : `Part ${index + 1}`;

                if (clean.length > 4000) {
                  chunkText(clean).forEach((chunk, idx) => {
                    chapters.push({ title: `${baseTitle}-${idx + 1}`, text: chunk });
                  });
                } else {
                  chapters.push({ title: baseTitle, text: clean });
                }
              }
            }
            if (completed === total) resolve(chapters);
          });
        });
      })
      .catch(reject);
  });
}

/**
 * Parse a PDF file and return [{title, text}] sections.
 */
async function parsePdf(filePath) {
  const pdf = require('pdf-parse');
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  const clean = data.text.replace(/\s+/g, ' ').trim();
  return chunkText(clean, 3800).map((chunk, i) => ({
    title: `Section ${i + 1}`,
    text: chunk,
  }));
}

module.exports = { chunkText, parseEpub, parsePdf };
