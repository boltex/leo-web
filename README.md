# Leo Web Editor

A web-based version of the Leo Editor - a structured document editor that allows you to organize your content in a hierarchical outline format.

## About

This project is a TypeScript single-page application that brings the Leo experience to the web. Leo is known for its unique approach to organizing documents through an outline-based structure, making it perfect for complex documentation, note-taking, programming and content organization.

> See Leo, the Literate Editor with Outline, at [leo-editor.github.io/leo-editor](https://leo-editor.github.io/leo-editor/)
> or on [github](https://github.com/leo-editor/leo-editor).

## Contributing

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Build

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

or, to also automatically open a browser loading the app

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

## Technologies Used

- **TypeScript** - Type-safe JavaScript
- **Webpack** - Module bundling and development server
- **HTML5 & CSS3** - Modern web standards
- **idb** - A small wrapper that makes IndexedDB usable.

## Contributing

This is the beginning of the Leo Web Editor project. Contributions, suggestions, and feedback are welcome!

## License

MIT License
