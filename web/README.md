# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

It contains the original Leo documentation adapted to the specificities of Leo-Web, mostly having to do with the UI being a browser instead of qt, and the implementation (and scripting) language being JavaScript instead of Python.

## To start a local server to test and develop the Leo-Web documentation website:

- cd into /web/

  `cd web`

- Install all dependencies (first time only)

  `npm install`

- Start local development server

  `npm run start`

## To build and create the /docs/ folder for the gh-pages branch.

Switch to gh-pages first - pulling devel into gh-pages as needed.

(cd into web and install dependencies first)

`npm run build --no-minify && node copy-build.js`

## More info

See [Docusaurus](https://docusaurus.io/) and the scripts the package.json file in the /web/folder for more examples.
