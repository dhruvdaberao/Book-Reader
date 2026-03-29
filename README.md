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
2. Run `./setup.ps1`
   - *This will install all Node modules (frontend/backend).*
   - *This will run `pip install TTS`.*
   - *It will also verify your Calibre installation.*

### How To Run ▶️
Run the app locally with ONE command:

```powershell
./start.ps1
```

If you prefer to start them manually:
- **Backend:** `cd server && npm start`
- **Frontend:** `cd client && npm run dev`

---

## Deployment Architecture (Vercel + Render)

### Frontend (Vercel)
Deploy only the `client` app to Vercel.

Set this environment variable in Vercel:

```env
VITE_API_URL=https://your-backend.onrender.com
```

The frontend calls:
- `POST ${VITE_API_URL}/api/upload`
- `POST ${VITE_API_URL}/api/tts`

### Backend (Render)
Deploy the `server` folder as a Node web service (not serverless).

1. Create a new **Web Service** in Render.
2. Set Root Directory to `server`.
3. Set Build Command to `npm install`.
4. Set Start Command to `npm start`.
5. Add environment variables as needed (`PORT` is provided by Render automatically).
6. Ensure the service has Python available for `tts_generator.py` execution.

Backend server uses:
- `const PORT = process.env.PORT || 3001`
- `app.use(cors({ origin: '*' }))`
- `multer` for upload handling
- Python process invocation for Coqui TTS

---

## Technical Details

### Backend Structure (`/server`)
- Uses `epub2` and `pdf-parse` to convert books into small paragraph chunks.
- When you click "play" on a chapter, the backend triggers `.wav` generation using `python/tts_generator.py` just-in-time.
- Audio and Text pieces are cached locally.

### Paid API Upgrade (OpenAI TTS) ⚡
If you prefer a faster or higher quality voice generation than the free Coqui TTS, you can easily switch to OpenAI's TTS service:

1. Inside the `/server` folder, create a `.env` file.
2. Add your OpenAI API Key:
   ```env
   OPENAI_API_KEY=sk-your_api_key_here...
   ```
3. Restart the server.
