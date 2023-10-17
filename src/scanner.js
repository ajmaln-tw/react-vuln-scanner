const fs = require('fs');
const acorn = require('acorn'); // JavaScript parser
const walk = require('acorn-walk'); // AST traversal

const xssPatterns = ['innerHTML', 'dangerouslySetInnerHTML', 'document.write', 'eval'];

function scanFile(filePath) {
    const sourceCode = fs.readFileSync(filePath, 'utf8');

    const ast = acorn.parse(sourceCode, { sourceType: 'module' });

    walk.simple(ast, {
        MemberExpression(node) {
            if (node.property && xssPatterns.includes(node.property.name)) {
                console.error(`Potential XSS vulnerability found in ${filePath}: ${node.property.name}`);
            }
        }
    });

    console.log(`=> Scanning file: ${filePath}`);
}

function scanProject(directoryPath) {
    console.log('\x1b[33m%s\x1b[0m', `[+] Scanning directory: ${directoryPath}`);

    fs.readdirSync(directoryPath).forEach((file) => {
        const filePath = `${directoryPath}/${file}`;
        if (fs.lstatSync(filePath).isDirectory()) {
            scanProject(filePath); // Recursively scan subdirectories.
        } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            scanFile(filePath); // Scan JavaScript or TypeScript files.
        }
    });
}

const projectDirectory = 'path/to/your/react/project';

console.log(`Starting the scanning process in directory: ${projectDirectory}`);
scanProject(projectDirectory);
