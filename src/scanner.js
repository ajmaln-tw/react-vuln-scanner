const fs = require("fs");
const acorn = require("acorn"); // JavaScript parser
const walk = require("acorn-walk"); // AST traversal

const xssPatterns = [
  "innerHTML",
  "dangerouslySetInnerHTML",
  "document.write",
  "eval",
];

// Function to add a delay using Promises.
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scanFile(filePath, scanStats) {
  const loaderChars = ["/", "|", "\\"];
  const isWebpackFile = filePath.toLowerCase().startsWith("webpack");

  // Skip scanning webpack files.
  if (isWebpackFile) {
    console.log(`Skipping webpack file: ${filePath}`);
    return;
  }

  try {
    const sourceCode = fs.readFileSync(filePath, "utf8");

    const ast = acorn.parse(sourceCode, { sourceType: "module" });

    let vulnFound = false;

    walk.simple(ast, {
      MemberExpression(node) {
        if (node.property && xssPatterns.includes(node.property.name)) {
          vulnFound = true;
          scanStats.vulnFound = true;
          process.stdout.write(
            `\rPotential XSS vulnerability found in ${filePath}: ${node.property.name}`
          );
        }
      },
    });

    // Loop to display the rotating cursor/loader on the same line.
    for (let i = 0; i < loaderChars.length; i++) {
      process.stdout.write(`\r${loaderChars[i]} Scanning file: ${filePath}`);
      await delay(1100);
    }

    // Clear the loader animation by writing spaces over it.
    process.stdout.write(`\r${" ".repeat(loaderChars[0].length + 18)}`);

    if (!vulnFound) {
      scanStats.noVulnFiles++;
    }
  } catch (error) {
    console.error(`Error while scanning file ${filePath}: ${error.message}`);
  }

  // Add a delay of 1 second (1000 milliseconds) before scanning the next file.
  await delay(3000);
}

async function scanProject(directoryPath) {
  const scanStats = {
    vulnFound: false,
    noVulnFiles: 0,
  };

  if (directoryPath.endsWith("node_modules")) {
    return; // Skip scanning the node_modules directory.
  }

  process.stdout.write(
    `\x1b[33m[+] Scanning directory: ${directoryPath} \n\x1b[0m`
  );

  fs.readdirSync(directoryPath).forEach((file) => {
    const filePath = `${directoryPath}/${file}`;
    if (fs.lstatSync(filePath).isDirectory()) {
      scanProject(filePath); // Recursively scan subdirectories.
    } else if (
      (filePath.endsWith(".js") || filePath.endsWith(".ts")) &&
      !filePath.toLowerCase().startsWith("webpack")
    ) {
      scanFile(filePath, scanStats); // Scan JavaScript or TypeScript files with a loader.
    }
  });

  if (!scanStats.vulnFound && scanStats.noVulnFiles > 0) {
    process.stdout.write(
      `\x1b[32mScanning code base completed. No vulnerabilities found. ✔\x1b[0m\n`
    );
  }
}

module.exports = scanProject;
