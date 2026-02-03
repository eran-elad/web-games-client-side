/**
 * FAQ page content configuration
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_CONTENT: FaqItem[] = [
  {
    question: 'How do I play Hitfinder?',
    answer: 'Type a song or artist name in the search box and select your guess from the dropdown. You have 8 attempts to guess the secret song. After each guess, you receive clues (year, country, genre, BPM, etc.) to help narrow down the answer.',
  },
  {
    question: 'What clues do I get?',
    answer: 'After each guess, you receive several clues: Year (how many years off), Country (distance and direction to the secret song\'s country), Genre (match or not), Tempo/BPM (how close the beats per minute are), and Duration (song length, when relevant).',
  },
  {
    question: 'How many guesses do I have?',
    answer: 'You have 8 guesses per puzzle. Use them wisely! The Lifeline feature can help narrow down the song list but costs 1 guess.',
  },
  {
    question: 'Can I play past puzzles?',
    answer: 'Yes! Use the Archive from the menu to play previous daily puzzles. Your progress on archived puzzles is tracked separately from the daily puzzle.',
  },
  {
    question: 'Is Hitfinder free?',
    answer: 'Yes, Hitfinder is completely free to play. No sign-up required to play, though creating a display name lets you appear on leaderboards.',
  },
  {
    question: 'How is the secret song chosen?',
    answer: 'Each day, a new hit song is selected as the puzzle. The songs are well-known tracks from various eras and genres to make the game fun and challenging.',
  },
  {
    question: 'What is the Lifeline?',
    answer: 'The Lifeline reduces the song list in the search box based on your previous clues. It becomes available after a few guesses, costs 1 guess to activate, and can only be used once per puzzle.',
  },
  {
    question: 'What is the Give Up button?',
    answer: 'If you\'re stuck, the Give Up button (available after 5 guesses) lets you surrender and reveal the secret song. The game ends when you give up.',
  },
];
