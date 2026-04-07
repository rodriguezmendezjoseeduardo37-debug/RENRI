const fs = require('fs');
const path = require('path');

const targetDesign = 'bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary/80 hover:shadow transition-all';

const regexPatterns = [
    // Matches standard outline buttons
    {
        find: /border border-white text-foreground( hover:bg-white)?( hover:text-primary-foreground)? transition-colors/g,
        replace: targetDesign
    },
    // Matches dark outline buttons
    {
        find: /border border-border text-muted-foreground( hover:border-foreground)?( hover:text-foreground)? transition-colors/g,
        replace: targetDesign
    },
    // Matches dark background outline alternative
    {
        find: /border border-border text-muted-foreground( hover:border-foreground)?( hover:text-foreground)? transition-colors bg-background/g,
        replace: targetDesign
    },
    // Matches ghost outline buttons
    {
        find: /border border-border text-foreground hover:bg-card transition-colors/g,
        replace: targetDesign
    },
    // Some buttons that might have been "fixed" partially before
    {
        find: /bg-secondary text-secondary-foreground rounded-xl shadow-sm hover:bg-secondary\/80 transition-all/g,
        replace: targetDesign
    },
    // More transparent variants
    {
        find: /border border-border text-\[#aaaaaa\]( hover:border-foreground)?( hover:text-foreground)? transition-colors/g,
        replace: targetDesign
    },
    {
        find: /bg-white text-foreground hover:bg-\[#cccccc\] transition-colors/g,
        replace: targetDesign
    },
    {
        find: /bg-foreground text-background hover:bg-foreground\/90 transition-colors/g,
        replace: targetDesign
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
            if (fullPath.includes('tailwind.config') || fullPath.includes('globals.css')) continue;

            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            // Make sure we only target our primary action buttons by requiring tracking-[0.2em] somewhere in the class
            // To be safe, we just apply standard replacements, because some buttons have tracking-[0.1em] or different padding.
            for (const { find, replace } of regexPatterns) {
                newContent = newContent.replace(find, replace);
            }

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Standardized buttons in: ${fullPath}`);
            }
        }
    }
}

console.log("Starting button standardization script...");
processDirectory(path.join(__dirname, '../src'));
console.log("Standardization complete.");
