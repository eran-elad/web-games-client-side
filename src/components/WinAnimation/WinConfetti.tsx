import { useEffect, useState } from 'react';
import './WinConfetti.css';

interface WinConfettiProps {
  isActive: boolean;
}

interface ConfettiNote {
  id: number;
  note: string;
  angle: number;
  distance: number;
  delay: number;
  rotation: number;
  x: number;
  y: number;
}

const MUSIC_NOTES = ['♪', '♫', '♬', '♭', '♯'];
const NUM_NOTES = 25;

const WinConfetti = ({ isActive }: WinConfettiProps) => {
  const [notes, setNotes] = useState<ConfettiNote[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate random confetti notes
      const newNotes: ConfettiNote[] = Array.from({ length: NUM_NOTES }, (_, i) => {
        const angle = Math.random() * 360; // Random direction in degrees
        const distance = 200 + Math.random() * 200; // Random distance 200-400px
        // Calculate x and y offsets using trigonometry
        const angleRad = (angle * Math.PI) / 180;
        const x = Math.cos(angleRad) * distance;
        const y = Math.sin(angleRad) * distance;
        
        return {
          id: i,
          note: MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)],
          angle: angle,
          distance: distance,
          delay: Math.random() * 0.3, // Random delay 0-0.3s
          rotation: Math.random() * 360, // Random rotation
          x: x,
          y: y,
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
          } as React.CSSProperties}
        >
          {note.note}
        </div>
      ))}
    </div>
  );
};

export default WinConfetti;
