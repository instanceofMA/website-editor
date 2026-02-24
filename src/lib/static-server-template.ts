/**
 * The Static Server logic is kept as a raw string to prevent the Next.js bundler
 * (Turbopack/Webpack) from attempting to polyfill or compile Node.js-specific
 * globals like 'Buffer' or 'require'.
 *
 * If we defined this as a real function, the bundler would inject complex polyfills
 * that don't exist inside the WebContainer environment, leading to ReferenceErrors.
 */
export const STATIC_SERVER_CONTENT = `
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    filePath = filePath.split('?')[0];

    if (filePath === './' || filePath === '.') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.warn('[Server] 404: ' + filePath);
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                console.error('[Server] 500: ' + error.code + ' for ' + filePath);
                res.writeHead(500);
                res.end('500 Server Error: ' + error.code);
            }
        } else {
            let body = content;
            let finalContentType = contentType;

            if (contentType === 'text/html') {
                let htmlStr = content.toString('utf-8');
                const scriptTag = '<script src="/__editor.js"></script>';
                if (htmlStr.includes('</body>')) {
                    htmlStr = htmlStr.replace('</body>', scriptTag + '</body>');
                } else {
                    htmlStr += scriptTag;
                }
                // Use globalThis.Buffer to avoid bundler mangling
                body = globalThis.Buffer.from(htmlStr, 'utf-8');
            }

            console.log('[Server] 200: ' + filePath + ' (' + finalContentType + ') - Size: ' + body.length);
            
            res.writeHead(200, { 
                'Content-Type': finalContentType,
                'Content-Length': body.length,
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            res.end(body);
        }
    });
});

server.listen(3000, () => {
    console.log('Static server listening on port 3000');
});
`;
