const fs = require('fs');
const path = require('path');

const replacements = [
    { find: /\bbg-black\b/g, replace: 'bg-background' },
    { find: /bg-\[\#0a0a0a\]/g, replace: 'bg-background' },
    { find: /bg-\[\#111111\]/g, replace: 'bg-card' },
    { find: /bg-\[\#1a1a1a\]/g, replace: 'bg-popover' },
    { find: /border-\[\#222222\]/g, replace: 'border-border' },
    { find: /border-\[\#333333\]/g, replace: 'border-border' },
    { find: /\btext-white\b/g, replace: 'text-foreground' },
    { find: /\btext-black\b/g, replace: 'text-foreground-inverse' }, // Be careful, but let's assume it usually meant dark text. Wait, we don't need to replace text-black unless it was for contrast
    { find: /hover:bg-\[\#111111\]/g, replace: 'hover:bg-accent' },
    { find: /hover:bg-\[\#222222\]/g, replace: 'hover:bg-accent' },
    { find: /hover:bg-\[\#f0f0f0\]/g, replace: 'hover:bg-accent' },
    { find: /hover:text-white/g, replace: 'hover:text-foreground' },
    { find: /hover:border-white/g, replace: 'hover:border-foreground' },
    { find: /text-\[\#888888\]/g, replace: 'text-muted-foreground' },
    { find: /text-\[\#999999\]/g, replace: 'text-muted-foreground' },
    { find: /text-\[\#666666\]/g, replace: 'text-muted-foreground' },
    { find: /text-\[\#555555\]/g, replace: 'text-muted-foreground' },
    { find: /text-\[\#bbbbbb\]/g, replace: 'text-muted-foreground' },
    { find: /hover:text-\[\#888888\]/g, replace: 'hover:text-muted-foreground' },
];

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            // Wait, we don't want to replace some specific components that we JUST refactored or where specific styling is required.
            // Exclude tailwind.config, global.css, etc
            if (fullPath.includes('tailwind.config') || fullPath.includes('globals.css') || fullPath.includes('error-boundary.tsx')) {
                continue;
            }

            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            for (const { find, replace } of replacements) {
                newContent = newContent.replace(find, replace);
            }

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

console.log("Starting theme refactor script...");
processDirectory(path.join(__dirname, '../src'));
console.log("Refactor complete.");
