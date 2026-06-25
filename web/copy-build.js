const fs = require('fs-extra');
const path = require('path');

// Define the paths
const sourceDir = path.join(__dirname, 'build');
const targetDir = path.join(__dirname, '..', 'dist');

// IF dist does not exist, exit with an error
if (!fs.existsSync(targetDir)) {
    console.error(`Error: Target directory "${targetDir}" does not exist.`);
    process.exit(1);
}

// Now, copy from build/docs to dist/docs
const sourceDocsDir = path.join(sourceDir, 'docs');
const targetDocsDir = path.join(targetDir, 'docs');

if (!fs.existsSync(sourceDocsDir)) {
    console.error(`Error: Source directory "${sourceDocsDir}" does not exist.`);
    process.exit(1);
}

// Copy the docs directory
fs.copy(sourceDocsDir, targetDocsDir, function (err) {
    if (err) {
        console.error('Error copying docs:', err);
        process.exit(1);
    }
    console.log('Docs directory copied successfully!');
});

// Second, same with build/assets to dist/assets
const sourceAssetsDir = path.join(sourceDir, 'assets');
const targetAssetsDir = path.join(targetDir, 'assets');

if (!fs.existsSync(sourceAssetsDir)) {
    console.error(`Error: Source directory "${sourceAssetsDir}" does not exist.`);
    process.exit(1);
}

// Copy the assets directory
fs.copy(sourceAssetsDir, targetAssetsDir, function (err) {
    if (err) {
        console.error('Error copying assets:', err);
        process.exit(1);
    }
    console.log('Assets directory copied successfully!');
});

// Third, if a build/search/ folder exists, copy it to dist/search
const sourceSearchDir = path.join(sourceDir, 'search');
const targetSearchDir = path.join(targetDir, 'search');

if (fs.existsSync(sourceSearchDir)) {
    fs.copy(sourceSearchDir, targetSearchDir, function (err) {
        if (err) {
            console.error('Error copying search:', err);
            process.exit(1);
        }
        console.log('Search directory copied successfully!');
    });
} else {
    console.log('No search directory found, skipping copy.');
}

// Lastly, if they exist, copy those two xml files: opensearch.xml and sitemap.xml
const filesToCopy = ['opensearch.xml', 'sitemap.xml'];
filesToCopy.forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);

    if (fs.existsSync(sourceFile)) {
        fs.copy(sourceFile, targetFile, function (err) {
            if (err) {
                console.error(`Error copying ${file}:`, err);
                process.exit(1);
            }
            console.log(`${file} copied successfully!`);
        });
    } else {
        console.log(`No ${file} found, skipping copy.`);
    }
});