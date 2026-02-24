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
  subtitle: "Guess the secret song in 8 tries!",
  sections: [
    {
      title: "🎵 The Goal",
      content: "Your mission is to guess the secret song of the day. You have 8 attempts to figure it out. Each guess gives you clues about how close you are to the answer.",
      icon: "🎯"
    },
    {
      title: "🔍 Making a Guess",
      content: "Type the name of a song or artist in the search box. Your first guess will be completely random. Select a song from the dropdown list and click 'Guess' or press Enter. You can search by song title, artist name and album.",
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
      content: "Reveals the distance and direction to the secret song's country. A green box means the country matches exactly. If it's wrong, you'll see the distance and a directional arrow (N, S, E, W, etc.). Distance is shown in kilometers or miles based on your settings.",
      icon: "🌍"
    },
    {
      title: "🎸 Genre",
      content: "Tells you if the genre matches. Green means exact match, red means it's different. The guessed genre name is shown to help you remember what you tried.",
      icon: "🎸"
    },
    {
      title: "⏱️ Duration",
      content: "Shows how close your guess is in terms of song length. This clue is normally hidden and only shows if there is a significant difference between the guess and the secret song.",
      icon: "⏱️"
    },
    {
      title: "🎵 Tempo",
      content: "Compares the BPM (beats per minute) of your guess to the secret song. Green means similar tempo, yellow means faster or slower, red means much faster or much slower. Grey means BPM data is unavailable for comparison.",
      icon: "🎵"
    },
    {
      title: "🎤 Artist & 💿 Album",
      content: "These bonus clues only appear when you guess correctly! These clues are normally hidden and only show if you get the right artist or album. The artist clue also appears if all other clues seemes correct or close. For songs with multiple credited artists or featured artists, the game uses combined artist and gender information directly from the server, and the tooltips explain whether it is a solo performer, group, collaboration, or a \"feat.\" combination.",
      icon: "🎤"
    },
    {
      title: "🛟 Lifeline",
      content: "Need help narrowing down your options? The Lifeline button reduces the song list in the search box based on your previous clues.\n• Available after a few guesses (shown in the button tooltip)\n• Costs 1 guess to activate\n• Can only be used once per puzzle\n• The narrowed list updates after each subsequent guess\n• Look for the 🛟 button next to the Guess button",
      icon: "🛟"
    },
    {
      title: "🏳️ Give Up",
      content: "Stuck and want to see the answer? The Give Up button (🏳️) lets you surrender and reveal the secret song.\n• Available after 5 guesses\n• The button appears grayed out until available\n• Once you give up, the game ends and the answer is revealed",
      icon: "🏳️"
    },
    {
      title: "⚙️ Settings & Navigation",
      content: "Access settings and navigation through the hamburger menu (☰) in the top corner:\n• 🏠 Home - Return to the welcome page at any time\n• ⚙️ Settings - Choose your preferred distance unit (km or miles)\n• Distance units are auto-detected based on your location, but you can change them anytime",
      icon: "⚙️"
    },
    {
      title: "📚 Archive",
      content: "Missed a day? Play past puzzles from the Archive! Access it from the welcome page to explore previous daily puzzles. Your progress on archived puzzles is tracked separately from the daily puzzle.",
      icon: "📚"
    },
    {
      title: "💡 Pro Tips",
      content: "• Use the info icons (ℹ️) next to each clue for detailed explanations\n• Hover over the ℹ️ next to the action buttons for button explanations\n• Try different artists from the same era if year is close\n• Pay attention to genre - it can narrow down your search significantly\n• Country clues help you think about music scenes and origins\n• Use the Lifeline when you're stuck to narrow down the search\n• Don't forget you can't guess the same song twice!",
      icon: "💡"
    },
    {
      title: "🏆 Winning",
      content: "If you guess correctly, you win! If you use all guesses, the game ends and the secret song is revealed. Check your statistics to track your progress and streaks!",
      icon: "🏆"
    }
  ],
  footer: "Good luck, and have fun discovering new music! 🎶"
};
