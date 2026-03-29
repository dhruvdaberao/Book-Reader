import { useState, useRef, useEffect } from 'react';
import { Play, Pause, FastForward, Rewind, SkipForward, SkipBack, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateTts } from '../api';

export default function AudioPlayer({ chapterText, title, onNext, onPrev, hasNext, hasPrev }) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const blobUrlRef = useRef(null); // keep track to revoke on cleanup

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState(null);

  // When chapter changes, fetch TTS audio
  useEffect(() => {
    if (!chapterText) return;

    // Reset state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setTtsError(null);
    setTtsLoading(true);

    // Revoke previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    let cancelled = false;

    (async () => {
      try {
        const audioBuffer = await generateTts(chapterText);
        if (cancelled) return;

        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.playbackRate = speed;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        }
        setTtsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('TTS error:', err);
        const msg = err?.response?.data
          ? new TextDecoder().decode(err.response.data)
          : err?.message || 'Failed to generate audio';
        try {
          setTtsError(JSON.parse(msg)?.error || msg);
        } catch {
          setTtsError(msg);
        }
        setTtsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [chapterText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || ttsLoading) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const skip = (amount) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime += amount;
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const newSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    audioRef.current.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

  const formatTime = (t) => {
    if (isNaN(t) || t === 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  if (!chapterText) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 p-4"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={onNext}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
      />

      {ttsError ? (
        /* Error State */
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-red-400 text-sm min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{ttsError}</span>
          </div>
          <button
            onClick={() => { setTtsError(null); setTtsLoading(true); /* trigger re-run by re-using chapterText */ }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-sm text-white shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          {/* Track Info */}
          <div className="flex-1 w-full md:w-auto truncate text-center md:text-left">
            <h3 className="text-sm font-semibold text-white truncate">{title || 'Audio Track'}</h3>
            {ttsLoading ? (
              <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin inline" /> Generating audio…
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">AudioBookify AI</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center flex-2 w-full max-w-lg">
            <div className="flex items-center gap-6 mb-2">
              <button onClick={onPrev} disabled={!hasPrev} className="text-slate-400 hover:text-white disabled:opacity-30">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={() => skip(-10)} disabled={ttsLoading} className="text-slate-400 hover:text-white disabled:opacity-30">
                <Rewind className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlay}
                disabled={ttsLoading}
                className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 text-slate-900 flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95"
              >
                {ttsLoading || isBuffering
                  ? <Loader2 className="w-5 h-5 animate-spin text-white" />
                  : (isPlaying ? <Pause className="w-5 h-5 ml-0.5" /> : <Play className="w-5 h-5 ml-1" />)
                }
              </button>
              <button onClick={() => skip(10)} disabled={ttsLoading} className="text-slate-400 hover:text-white disabled:opacity-30">
                <FastForward className="w-5 h-5" />
              </button>
              <button onClick={onNext} disabled={!hasNext} className="text-slate-400 hover:text-white disabled:opacity-30">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span>{formatTime(currentTime)}</span>
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="flex-1 h-2 bg-slate-700 hover:bg-slate-600 rounded-full overflow-hidden cursor-pointer"
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Speed */}
          <div className="flex-1 flex justify-end w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={toggleSpeed}
              disabled={ttsLoading}
              className="text-xs font-bold text-cyan-400 border border-cyan-800 bg-cyan-900/40 hover:bg-cyan-900 px-3 py-1 rounded-full transition-colors disabled:opacity-40"
            >
              {speed}x
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
