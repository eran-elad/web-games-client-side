/**
 * Help page content configuration
 * Easy to maintain and update help text
 */

export interface HelpSection {
  title: string;
  content: string;
  icon?: string;
}

export const HELP_CONTENT = {
  title: "How to Play",
  subtitle: "Guess the secret song in 6 tries!",
  sections: [
    {
      title: "🎵 The Goal",
      content: "Your mission is to guess the secret song of the day. You have 6 attempts to figure it out. Each guess gives you clues about how close you are to the answer.",
      icon: "🎯"
    },
    {
      title: "🔍 Making a Guess",
      content: "Type the name of a song or artist in the search box. Select a song from the dropdown list and click 'Guess' or press Enter. You can search by song title, artist name and album.",
      icon: "⌨️"
    },
    {
      title: "💡 Understanding the Clues",
      content: "After each guess, you'll receive several clues to help you narrow down the answer:",
      icon: "🧩"
    },
    {
      title: "📅 Year",
      content: "Shows how many years off your guess is. A green box means you got it exactly right! A blue box means you're close. A red box means you're further away.",
      icon: "📅"
    },
    {
      title: "🌍 Country",
      content: "Reveals the distance and direction to the secret song's country. A green box means the country matches exactly. If it's wrong, you'll see the distance in kilometers and a directional arrow (N, S, E, W, etc.).",
      icon: "🌍"
    },
    {
      title: "🎸 Genre",
      content: "Tells you if the genre matches. Green means exact match, red means it's different. The guessed genre name is shown to help you remember what you tried.",
      icon: "🎸"
    },
    {
      title: "⏱️ Duration",
      content: "Shows how close your guess is in terms of song length. Green for exact match, blue if you're close, red if you're far off.",
      icon: "⏱️"
    },
    {
      title: "🎤 Artist & 💿 Album",
      content: "These bonus clues only appear when you guess correctly! If you get the right artist or album, you'll see a green box confirming it. If you're wrong, these clues won't show at all.",
      icon: "🎤"
    },
    {
      title: "💡 Pro Tips",
      content: "• Use the info icons (ℹ️) next to each clue for detailed explanations\n• Try different artists from the same era if year is close\n• Pay attention to genre - it can narrow down your search significantly\n• Country clues help you think about music scenes and origins\n• Don't forget you can't guess the same song twice!",
      icon: "💡"
    },
    {
      title: "🏆 Winning",
      content: "If you guess correctly, you win! If you use all 6 guesses, the game ends and the secret song is revealed. Check your statistics to track your progress and streaks!",
      icon: "🏆"
    }
  ],
  footer: "Good luck, and have fun discovering new music! 🎶"
};
