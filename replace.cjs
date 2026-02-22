const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (!['node_modules', '.git', '.vercel', 'dist'].includes(file)) {
                getFiles(name, files);
            }
        } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
            files.push(name);
        }
    }
    return files;
}

const files = getFiles('.');
let changed = 0;
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('purple')) {
        content = content.replace(/purple/g, 'cyan');
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
        changed++;
    }
}
console.log('Replaced in ' + changed + ' files');
