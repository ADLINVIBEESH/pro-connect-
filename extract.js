const fs = require('fs');
const path = 'C:\\Users\\adlin\\.gemini\\antigravity\\brain\\f30f3795-be94-4215-a967-1f0979f18f98\\.system_generated\\logs\\overview.txt';

if (!fs.existsSync(path)) {
    console.error("Log file not found");
    process.exit(1);
}

const content = fs.readFileSync(path, 'utf8');

// The JSON string starts with {"v":"5.3.4" and ends before "replace this button"
const startIndex = content.lastIndexOf('{"v":"5.3.4"');
let jsonStr = "";

if (startIndex !== -1) {
    const fromStart = content.substring(startIndex);
    const endIndex = fromStart.indexOf('replace this button');
    if (endIndex !== -1) {
        jsonStr = fromStart.substring(0, endIndex).trim();
    } else {
        // Try to match till end of json
        let braceCount = 0;
        let p = 0;
        let started = false;
        for (let i=0; i<fromStart.length; i++) {
            if (fromStart[i] === '{') { braceCount++; started = true; }
            else if (fromStart[i] === '}') { braceCount--; }
            if (started && braceCount === 0) {
                jsonStr = fromStart.substring(0, i+1);
                break;
            }
        }
    }
} else {
    // try to match any json string containing "nm":"attach"
    console.error("Could not find start index");
    process.exit(1);
}

if (!jsonStr) {
    console.error("Could not parse json");
    process.exit(1);
}

try {
    JSON.parse(jsonStr);
} catch (e) {
    console.error("Extracted string is not valid JSON:", e);
    process.exit(1);
}

const outPath = 'd:\\benjamin frontend\\proconnect\\frontend\\src\\assets\\attach-lottie.json';
fs.writeFileSync(outPath, jsonStr, 'utf8');
console.log("Successfully wrote attach-lottie.json");
