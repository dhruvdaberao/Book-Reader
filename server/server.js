require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const { spawn } = require('child_process');
const crypto = require('crypto');
const { parseEpub, parsePdf, convertToEpub, chunkText } = require('./utils');

const app = express();
app.use(cors());
app.use(express.json());

// Setup storage directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const AUDIO_DIR = path.join(__dirname, 'audio');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Database simulation
const dbPath = path.join(__dirname, 'db.json');
async function getDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { books: {} };
  }
}
async function saveDb(db) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

// ---------------------------------------------------------
// Upload & Process Endpoint
// ---------------------------------------------------------
app.post('/api/upload', upload.single('book'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const bookId = crypto.randomUUID();
  let filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  
  try {
    let chapters = [];
    let title = req.file.originalname.replace(ext, '');
    
    // Process based on file type
    if (ext === '.pdf') {
      chapters = await parsePdf(filePath);
    } else if (ext === '.epub') {
      chapters = await parseEpub(filePath);
    } else if (ext === '.prc' || ext === '.mobi') {
      const epubPath = path.join(UPLOADS_DIR, bookId + '.epub');
      await convertToEpub(filePath, epubPath);
      chapters = await parseEpub(epubPath);
    } else if (ext === '.txt') {
      const text = await fs.readFile(filePath, 'utf8');
      const chunks = chunkText(text.replace(/\s+/g, ' ').trim(), 1500);
      chapters = chunks.map((c, i) => ({ title: `Section ${i + 1}`, text: c }));
    } else {
      return res.status(400).json({ error: 'Unsupported format' });
    }
    
    // Save to DB
    const db = await getDb();
    db.books[bookId] = { id: bookId, title, originalName: req.file.originalname, chapters };
    await saveDb(db);
    
    res.json({ id: bookId, title, totalChapters: chapters.length });
    
  } catch (error) {
    console.error("Processing Error:", error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// ---------------------------------------------------------
// Get Chapters List Endpoint
// ---------------------------------------------------------
app.get('/api/book/:id/chapters', async (req, res) => {
  const db = await getDb();
  const book = db.books[req.params.id];
  if (!book) return res.status(404).json({ error: 'Book not found' });
  
  res.json({
    id: book.id,
    title: book.title,
    chapters: book.chapters.map((c, i) => ({ index: i, title: c.title }))
  });
});

// ---------------------------------------------------------
// Stream Audio Output (TTS Generation if needed)
// ---------------------------------------------------------
app.get('/api/stream/:bookId/:chapterIndex', async (req, res) => {
  const { bookId, chapterIndex } = req.params;
  const db = await getDb();
  const book = db.books[bookId];
  
  if (!book || !book.chapters[chapterIndex]) {
    return res.status(404).json({ error: 'Chapter not found' });
  }
  
  const text = book.chapters[chapterIndex].text;
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const audioFile = path.join(AUDIO_DIR, `${hash}.wav`);
  const textFile = path.join(UPLOADS_DIR, `${hash}.txt`);
  
  try {
    await fs.access(audioFile);
    // Audio exists, stream it
    return res.download(audioFile, 'audio.wav');
  } catch (err) {
    // Generate audio
    try {
      await fs.writeFile(textFile, text);
      const pythonProcess = spawn('python', [
        path.join(__dirname, 'python', 'tts_generator.py'),
        '--text_file', textFile,
        '--output_file', audioFile,
        process.env.OPENAI_API_KEY ? '--openai' : ''
      ]);
      
      let stderr = '';
      pythonProcess.stderr.on('data', data => stderr += data.toString());
      
      pythonProcess.on('close', code => {
        if (code !== 0) {
           console.error('Python Error:', stderr);
           return res.status(500).json({ error: 'TTS generation failed' });
        }
        res.download(audioFile, 'audio.wav');
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to stream audio' });
    }
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`AudioBookify API Server running on port ${PORT}`);
});
