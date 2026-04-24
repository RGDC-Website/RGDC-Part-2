const fs = require('fs');
const path = process.argv[2];
if (!path) {
    console.error('Usage: node check_syntax.js <file>');
    process.exit(2);
}
const txt = fs.readFileSync(path, 'utf8');
const stack = [];
let line = 1;
let col = 0;
let inSingle = false, inDouble = false, inTemplate = false, inBlockComment = false, inLineComment = false, prev = '';
for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    col++;
    if (ch === '\n') { line++; col = 0; inLineComment = false; }
    // handle comment states
    if (!inSingle && !inDouble && !inTemplate) {
        if (!inBlockComment && ch === '/' && txt[i + 1] === '*') { inBlockComment = true; i++; col++; prev = ''; continue; }
        if (!inLineComment && !inBlockComment && ch === '/' && txt[i + 1] === '/') { inLineComment = true; i++; col++; prev = ''; continue; }
        if (inBlockComment && ch === '*' && txt[i + 1] === '/') { inBlockComment = false; i++; col++; prev = ''; continue; }
    }
    if (inBlockComment || inLineComment) { prev = ch; continue; }

    // handle string/template toggles (ignore escaped quotes)
    if (!inDouble && !inTemplate && ch === "'" && prev !== '\\') { inSingle = !inSingle; prev = ch; continue; }
    if (!inSingle && !inTemplate && ch === '"' && prev !== '\\') { inDouble = !inDouble; prev = ch; continue; }
    if (!inSingle && !inDouble && ch === '`' && prev !== '\\') { inTemplate = !inTemplate; prev = ch; continue; }
    if (inSingle || inDouble || inTemplate) { prev = ch; continue; }

    // track opening/closing
    if (ch === '(' || ch === '{' || ch === '[') { stack.push({ c: ch, line, col }); }
    else if (ch === ')' || ch === '}' || ch === ']') {
        const last = stack.pop();
        const match = (ch === ')' && last && last.c === '(') || (ch === '}' && last && last.c === '{') || (ch === ']' && last && last.c === '[');
        if (!match) {
            console.error('MISMATCH at', path + ':' + line + ':' + col, 'found', ch, 'expected', last ? ('matching for ' + last.c + ' opened at ' + last.line + ':' + last.col) : 'no opener');
            process.exit(1);
        }
    }
    prev = ch;
}
if (inSingle || inDouble || inTemplate || inBlockComment) {
    console.error('Unterminated string/template/comment detected in', path, 'state:', { inSingle, inDouble, inTemplate, inBlockComment });
    process.exit(1);
}
if (stack.length) {
    const s = stack[stack.length - 1];
    console.error('Unclosed opener', s.c, 'at', path + ':' + s.line + ':' + s.col);
    process.exit(1);
}