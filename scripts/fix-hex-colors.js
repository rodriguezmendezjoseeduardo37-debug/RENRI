const fs = require('fs');
const path = require('path');

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            if (fullPath.includes('tailwind.config') || fullPath.includes('globals.css')) continue;

            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            // Backgrounds
            newContent = newContent.replace(/bg-\[#0[0-9a-fA-F]{5}\]/g, 'bg-card'); // bg-[#010101] to bg-[#0f...]
            newContent = newContent.replace(/bg-\[#1[0-9a-fA-F]{5}\]/g, 'bg-accent'); // bg-[#111...]
            newContent = newContent.replace(/bg-\[#2[0-9a-fA-F]{5}\]/g, 'bg-popover'); // bg-[#222...]
            newContent = newContent.replace(/bg-\[#[a-fA-F0-9]{3,6}\]/g, 'bg-secondary'); // fallback
            
            // Hover background
            newContent = newContent.replace(/hover:bg-\[#[a-fA-F0-9]{3,6}\]/g, 'hover:bg-accent');

            // Borders
            newContent = newContent.replace(/border-\[#[a-fA-F0-9]{3,6}\]/g, 'border-border');
            newContent = newContent.replace(/hover:border-\[#[a-fA-F0-9]{3,6}\]/g, 'hover:border-foreground');

            // Text
            // We want to be careful not to replace text that meant to be primary white/black
            newContent = newContent.replace(/text-\[#([0-4][0-9a-fA-F]{5}|[0-9a-fA-F]{3})\]/g, 'text-foreground'); // Very dark colors mapping to foreground
            newContent = newContent.replace(/text-\[#[5-9a-fA-F][0-9a-fA-F]{5}\]/g, 'text-muted-foreground'); // Greys and lights mapping to muted-foreground
            newContent = newContent.replace(/text-\[#[a-fA-F0-9]{3,6}\]/g, 'text-muted-foreground'); // Fallback text hex

            // Hover Text
            newContent = newContent.replace(/hover:text-\[#[a-fA-F0-9]{3,6}\]/g, 'hover:text-foreground');

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Cleaned hex colors in: ${fullPath}`);
            }
        }
    }
}

console.log("Starting hex colors cleanup script...");
processDirectory(path.join(__dirname, '../src'));
console.log("Cleanup complete.");
