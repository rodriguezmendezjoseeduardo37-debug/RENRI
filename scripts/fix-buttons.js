const fs = require('fs');
const path = require('path');

const replacements = [
    // Replace the broken text-foreground-inverse and hardcoded bg-white buttons with semantic rounded secondary buttons
    {
        find: /bg-white text-foreground-inverse hover:bg-\[#cccccc\] transition-colors/g,
        replace: 'bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 transition-all'
    },
    {
        find: /bg-white text-foreground-inverse hover:bg-\[#d6d6d6\] transition-colors/g,
        replace: 'bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 transition-all'
    },
    {
        find: /bg-white text-foreground-inverse/g,
        replace: 'bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80'
    },
    {
        find: /text-foreground-inverse/g,
        replace: 'text-primary-foreground' // Fallback for any other instances
    }
];

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            for (const { find, replace } of replacements) {
                newContent = newContent.replace(find, replace);
            }

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Fixed buttons in: ${fullPath}`);
            }
        }
    }
}

console.log("Starting button fix script...");
processDirectory(path.join(__dirname, '../src'));
console.log("Button fix complete.");
