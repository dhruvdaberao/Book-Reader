import { useState, useEffect } from 'react';
import { BookOpen, Headphones, Settings, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Uploader from './components/Uploader';
import AudioPlayer from './components/AudioPlayer';
import { getChapters, getStreamUrl } from './api';

function App() {
  const [currentBook, setCurrentBook] = useState(null); // { id, title, totalChapters }
  const [chapters, setChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(null);
  
  // Load saved state (Resume playback)
  useEffect(() => {
    const savedBook = localStorage.getItem('audiobookify_last_book');
    const savedChapter = localStorage.getItem('audiobookify_last_chapter');
    
    if (savedBook && savedChapter) {
      const book = JSON.parse(savedBook);
      setCurrentBook(book);
      loadChapters(book.id, parseInt(savedChapter));
    }
  }, []);

  const handleUploadComplete = (data) => {
    setCurrentBook(data);
    localStorage.setItem('audiobookify_last_book', JSON.stringify(data));
    loadChapters(data.id, 0);
  };

  const loadChapters = async (bookId, startIndex) => {
    try {
      const data = await getChapters(bookId);
      setChapters(data.chapters);
      setCurrentChapterIndex(startIndex);
      localStorage.setItem('audiobookify_last_chapter', startIndex.toString());
    } catch (err) {
      console.error('Failed to load chapters:', err);
    }
  };

  const handlePlayChapter = (index) => {
    setCurrentChapterIndex(index);
    localStorage.setItem('audiobookify_last_chapter', index.toString());
  };

  const nextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      handlePlayChapter(currentChapterIndex + 1);
    }
  };

  const prevChapter = () => {
    if (currentChapterIndex > 0) {
      handlePlayChapter(currentChapterIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-x-hidden selection:bg-cyan-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              AudioBookify <span className="text-cyan-400">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 text-slate-400">
            <button className="p-2 hover:bg-slate-800 rounded-full transition-colors hidden sm:block">
              <History className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 pb-32">
        <AnimatePresence mode="wait">
          {!currentBook ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mt-10"
            >
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                  Turn Any Book Into an <br className="hidden md:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Instant Audiobook
                  </span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Upload your EPUB, PDF, or MOBI/PRC. Our AI extracts the text and uses advanced synthetic voices to read it to you with a single click.
                </p>
              </div>

              <Uploader onUploadComplete={handleUploadComplete} />
            </motion.div>
          ) : (
            <motion.div
              key="player-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-full max-w-4xl bg-slate-800/40 rounded-3xl border border-slate-700 p-8 shadow-2xl mb-12">
                <div className="flex items-start gap-6">
                  <div className="w-32 h-40 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-inner flex items-center justify-center border border-slate-600">
                    <BookOpen className="w-12 h-12 text-slate-500" />
                  </div>
                  <div className="flex-1 mt-2">
                    <h2 className="text-3xl font-bold text-white mb-2">{currentBook.title}</h2>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <span className="px-3 py-1 rounded-full bg-cyan-900/30 text-cyan-400 border border-cyan-800">
                        {currentBook.totalChapters || chapters.length} Parts
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        AI Narrated
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" /> Chapters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chapters.map((chapter, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePlayChapter(idx)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          currentChapterIndex === idx
                            ? 'bg-cyan-900/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-50'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        <div className="font-medium truncate pr-2">{chapter.title}</div>
                        <div className="text-xs mt-1 text-slate-500">
                          {currentChapterIndex === idx ? 'Now Playing' : 'Click to Play'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setCurrentBook(null);
                  setCurrentChapterIndex(null);
                  setChapters([]);
                  localStorage.removeItem('audiobookify_last_book');
                }}
                className="text-slate-400 hover:text-white underline underline-offset-4 decoration-slate-600"
              >
                Upload a different book
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Player */}
      {currentBook && currentChapterIndex !== null && chapters.length > 0 && (
        <AudioPlayer 
          audioUrl={getStreamUrl(currentBook.id, currentChapterIndex)}
          title={`${currentBook.title} - ${chapters[currentChapterIndex]?.title}`}
          onNext={nextChapter}
          onPrev={prevChapter}
          hasNext={currentChapterIndex < chapters.length - 1}
          hasPrev={currentChapterIndex > 0}
        />
      )}
    </div>
  );
}

export default App;
