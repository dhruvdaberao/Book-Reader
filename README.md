# AudioBookify AI 🎧

Listen to any book instantly using an advanced AI Text-To-Speech engine. This full-stack web application parses your uploaded EPUB, PDF, PR, MOBI, and TXT files, automatically generating a synthetic voice-over with a premium audio player.

## Built With 🧱
* **React + Vite** (Tailwind CSS, Framer Motion)
* **Node.js + Express** (Backend parsing and API endpoints)
* **Coqui TTS** (Local, free python TTS generation)
* **Calibre CLI** (For PRC/MOBI format support)

## Setup Instructions ⚙️

### Prerequisites
1. **Node.js v18+** installed.
2. **Python 3.9+** installed (required for the AI Voice).
3. **Calibre** installed (Optional: Only required if you want to support `.prc` and `.mobi` files). Add Calibre to your system PATH to make `ebook-convert` available globally.

### 1-Click Installation (Windows)
We provide an automated setup script that will handle all dependencies for you:
1. Open up a terminal in this root folder.
2. Run `.\setup.ps1`
   - *This will install all Node modules (frontend/backend).*
   - *This will run `pip install TTS`.*
   - *It will also verify your Calibre installation.*

### How To Run ▶️
Run the app locally with ONE command:

```powershell
.\start.ps1
```

If you prefer to start them manually:
- **Backend:** `cd server && node server.js`
- **Frontend:** `cd client && npm run dev`

---

## Technical Details

### Backend Structure (`/server`)
- Uses `epub2` and `pdf-parse` to convert books into small paragraph chunks.
- When you click "play" on a chapter, the backend triggers `.wav` generation using `python/tts_generator.py` just-in-time, bypassing the need to wait 15 minutes for a whole book.
- Audio and Text pieces are cached locally.

### Paid API Upgrade (OpenAI TTS) ⚡
If you prefer a faster or higher quality voice generation than the free Coqui TTS, you can easily switch to OpenAI's TTS service:

1. Inside the `/server` folder, create a `.env` file.
2. Add your OpenAI API Key:
   ```env
   OPENAI_API_KEY=sk-your_api_key_here...
   ```
3. Restart the server. The `tts_generator.py` script will automatically detect this key and fall back to OpenAI API instead of running your local Coqui models.
