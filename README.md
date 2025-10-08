# Leo Web Editor

A web-based version of the Leo Editor - a structured document editor that allows you to organize your content in a hierarchical outline format.

## About

This project is a TypeScript single-page application that brings the Leo Editor experience to the web. Leo Editor is known for its unique approach to organizing documents through an outline-based structure, making it perfect for complex documentation, note-taking, and content organization.

## Features

- **Hierarchical Document Structure**: Organize your content in a tree-like outline
- **Interactive Outline Navigation**: Click to expand/collapse nodes and navigate the structure
- **TypeScript Implementation**: Built with modern TypeScript for type safety and better development experience
- **Responsive Design**: Works well on different screen sizes
- **Hot Reload Development**: Fast development with webpack dev server

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

or

```bash
npm start
```

This will start the webpack dev server and automatically open the application in your browser at `http://localhost:8080`.

### Building for Production

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Other Scripts

- `npm run type-check` - Run TypeScript type checking without building
- `npm run clean` - Clean the dist directory

## Project Structure

```
leo-web/
├── src/
│   ├── leo/
│   │   └── LeoEditor.ts      # Core Leo Editor functionality
│   ├── index.html            # Main HTML template
│   ├── index.ts              # Application entry point
│   └── styles.css            # Global styles
├── dist/                     # Build output (generated)
├── webpack.config.js         # Webpack configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies and scripts
└── README.md               # This file
```

## Technologies Used

- **TypeScript** - Type-safe JavaScript
- **Webpack** - Module bundling and development server
- **HTML5 & CSS3** - Modern web standards
- **VS Code inspired styling** - Familiar dark theme

## Contributing

This is the beginning of the Leo Web Editor project. Contributions, suggestions, and feedback are welcome!

## License

MIT License
