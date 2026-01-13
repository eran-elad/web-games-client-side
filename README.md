# Music Game Client

A daily music guessing game client built with React, TypeScript, and Vite. Players have 6 attempts to guess the secret song of the day using clues about year, country, genre, duration, artist, and album.


## Features

- 🎵 Daily music puzzle with a new secret song each day
- 🔍 Intelligent song search with autocomplete
- 💡 Clue system with visual feedback (Year, Country, Genre, Duration, Artist, Album)
- 📊 Player statistics tracking
- 📅 Archive of historical puzzles
- 🎉 Win animations and celebrations
- 📱 Responsive design for mobile and desktop
- 🔗 Share results with friends

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - UI components
- **CSS3** - Styling with animations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/eran-elad/web-games-client-side.git
cd web-games-client-side
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Available Scripts

- `npm run dev` - Start the development server with hot module replacement
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
src/
├── components/          # React components
│   ├── ActiveGame/      # Main game component
│   ├── ArchivePage/     # Historical puzzles archive
│   ├── GuessBox/        # Individual guess display
│   ├── HelpPage/        # Game instructions
│   ├── ShareResult/     # Share functionality
│   ├── SongAutocomplete/# Song search component
│   ├── StatisticsPage/ # Player statistics
│   └── WinAnimation/   # Win celebration
├── config/             # Configuration files
│   ├── clueThresholds.ts
│   ├── countryCodes.ts
│   ├── gameConfig.ts
│   └── helpContent.ts
├── services/           # API services
│   └── gameApi.ts
└── utils/             # Utility functions
    └── storage.ts
```

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be deployed to any static hosting service.

## License

This project is private and proprietary.
