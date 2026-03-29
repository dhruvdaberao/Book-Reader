import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, FastForward, Rewind, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AudioPlayer({ audioUrl, title, onNext, onPrev, hasNext, hasPrev }) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);

  // Playback control
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
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

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !audioRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  // Render
  if (!audioUrl) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 p-4"
    >
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={onNext}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
      />

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
        {/* Track Info */}
        <div className="flex-1 w-full md:w-auto truncate text-center md:text-left">
          <h3 className="text-sm font-semibold text-white truncate">{title || "Audio Track"}</h3>
          <p className="text-xs text-slate-400 mt-1">AudioBookify AI</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center flex-2 w-full max-w-lg">
          <div className="flex items-center gap-6 mb-2">
            <button onClick={onPrev} disabled={!hasPrev} className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={() => skip(-10)} className="text-slate-400 hover:text-white">
              <Rewind className="w-5 h-5" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95"
            >
              {isBuffering ? <Loader2 className="w-5 h-5 animate-spin"/> : (isPlaying ? <Pause className="w-5 h-5 ml-0.5" /> : <Play className="w-5 h-5 ml-1" />)}
            </button>
            <button onClick={() => skip(10)} className="text-slate-400 hover:text-white">
              <FastForward className="w-5 h-5" />
            </button>
            <button onClick={onNext} disabled={!hasNext} className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span>{formatTime(currentTime)}</span>
            <div 
              ref={progressRef}
              onClick={handleProgressClick}
              className="flex-1 h-2 bg-slate-700 hover:bg-slate-600 rounded-full overflow-hidden cursor-pointer flex items-center"
            >
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 relative"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Extra actions */}
        <div className="flex-1 flex justify-end w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={toggleSpeed}
            className="text-xs font-bold text-cyan-400 border border-cyan-800 bg-cyan-900/40 hover:bg-cyan-900 px-3 py-1 rounded-full transition-colors"
          >
            {speed}x
          </button>
        </div>
      </div>
    </motion.div>
  );
}
