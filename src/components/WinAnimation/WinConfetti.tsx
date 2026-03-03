import { useEffect, useState } from 'react';
import './WinConfetti.css';

interface WinConfettiProps {
  isActive: boolean;
}

interface ConfettiNote {
  id: number;
  symbol: string;
  color: string;
  angle: number;
  distance: number;
  delay: number;
  rotation: number;
  x: number;
  y: number;
  size: number; // scale factor for variety
}

const MUSIC_NOTES = ['♪', '♫', '♬', '♭', '♯'];
const EXTRA_SYMBOLS = ['★', '☆', '✦', '✧', '✨', '♥', '♦', '♠', '♣', '●', '◆', '▲'];
const ALL_SYMBOLS = [...MUSIC_NOTES, ...EXTRA_SYMBOLS];

// Glossy, vibrant palette
const GLOSSY_COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c',
  '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
  '#fa709a', '#fee140', '#30cfd0', '#a8edea',
  '#ff9a9e', '#fecfef', '#ffecd2', '#fcb69f',
  '#a18cd1', '#fbc2eb', '#ff6b6b', '#c44569',
];
const NUM_PIECES = 55;

const WinConfetti = ({ isActive }: WinConfettiProps) => {
  const [notes, setNotes] = useState<ConfettiNote[]>([]);

  useEffect(() => {
    if (isActive) {
      const newNotes: ConfettiNote[] = Array.from({ length: NUM_PIECES }, (_, i) => {
        const angle = Math.random() * 360;
        const distance = 180 + Math.random() * 280; // 180–460px spread
        const angleRad = (angle * Math.PI) / 180;
        const x = Math.cos(angleRad) * distance;
        const y = Math.sin(angleRad) * distance;
        return {
          id: i,
          symbol: ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
          color: GLOSSY_COLORS[Math.floor(Math.random() * GLOSSY_COLORS.length)],
          angle,
          distance,
          delay: Math.random() * 0.5,
          rotation: Math.random() * 720 - 360,
          x,
          y,
          size: 0.7 + Math.random() * 0.8, // 0.7–1.5
        };
      });
      setNotes(newNotes);
    } else {
      setNotes([]);
    }
  }, [isActive]);

  if (!isActive || notes.length === 0) {
    return null;
  }

  return (
    <div className="win-confetti-container">
      {notes.map((note) => (
        <div
          key={note.id}
          className="confetti-note"
          style={{
            '--x': `${note.x}px`,
            '--y': `${note.y}px`,
            '--delay': `${note.delay}s`,
            '--rotation': `${note.rotation}deg`,
            '--color': note.color,
            '--size': note.size,
          } as React.CSSProperties}
        >
          {note.symbol}
        </div>
      ))}
    </div>
  );
};

export default WinConfetti;
