# Contributing

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Build

1. Clone the repository

```bash
git clone https://github.com/boltex/leo-web.git
```

2. Install dependencies

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

The generated files will be in the `dist/` directory.

### Other Scripts

- `npm run type-check` - Run TypeScript type checking without building
- `npm run clean` - Clean the dist directory
