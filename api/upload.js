const formidable = require('formidable');
const path = require('path');
const crypto = require('crypto');
const { parseEpub, parsePdf, chunkText } = require('./_lib/parse');
const fs = require('fs/promises');

// Disable Vercel's default body parser so formidable can handle multipart
module.exports.config = { api: { bodyParser: false } };

module.exports.default = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable({
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    uploadDir: '/tmp',
    keepExtensions: true,
  });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    console.error('Formidable parse error:', err);
    return res.status(400).json({ error: 'Failed to parse upload. File may be too large (max 50 MB).' });
  }

  const fileObj = Array.isArray(files.book) ? files.book[0] : files.book;
  if (!fileObj) return res.status(400).json({ error: 'No file uploaded. Make sure the field name is "book".' });

  const originalName = fileObj.originalFilename || fileObj.newFilename || 'Unknown';
  const ext = path.extname(originalName).toLowerCase();
  const filePath = fileObj.filepath;
  const bookId = crypto.randomUUID();
  const title = originalName.replace(new RegExp(`\\${ext}$`, 'i'), '').trim() || 'Unknown Book';

  try {
    let chapters = [];

    if (ext === '.epub') {
      chapters = await parseEpub(filePath);
    } else if (ext === '.pdf') {
      chapters = await parsePdf(filePath);
    } else if (ext === '.txt') {
      const text = await fs.readFile(filePath, 'utf8');
      const { chunkText } = require('./_lib/parse');
      chapters = chunkText(text.replace(/\s+/g, ' ').trim(), 3800).map((c, i) => ({
        title: `Section ${i + 1}`,
        text: c,
      }));
    } else {
      return res.status(400).json({ error: 'Unsupported format. Please upload EPUB, PDF, or TXT.' });
    }

    if (!chapters || chapters.length === 0) {
      return res.status(422).json({ error: 'Could not extract any text from this file. It may be scanned or DRM-protected.' });
    }

    // Return ALL chapter data — client holds it in localStorage (no DB needed)
    return res.status(200).json({
      id: bookId,
      title,
      totalChapters: chapters.length,
      chapters, // [{title, text}]
    });
  } catch (err) {
    console.error('Processing error:', err);
    return res.status(500).json({ error: 'Failed to process the book. ' + (err.message || '') });
  }
};
