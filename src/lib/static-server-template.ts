export const STATIC_SERVER_CONTENT = `
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    // Strip query params
    filePath = filePath.split('?')[0];

    if (filePath === './' || filePath === '.') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            
            if (contentType === 'text/html') {
                let htmlStr = content.toString('utf-8');
                const scriptTag = '<script src="/__editor.js"></script>';
                if (htmlStr.includes('</body>')) {
                    htmlStr = htmlStr.replace('</body>', scriptTag + '</body>');
                } else {
                    htmlStr += scriptTag;
                }
                res.end(htmlStr, 'utf-8');
            } else {
                res.end(content);
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Static server started on port 3000');
});
`;
