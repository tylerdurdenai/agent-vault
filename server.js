import http from 'http'
import fs from 'fs'
import path from 'path'

const PORT = process.env.PORT || 8080
const DIST = process.env.DIST || './dist'

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
}

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url)
  
  // SPA fallback
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html')
  }
  
  const ext = path.extname(filePath)
  const contentType = mimeTypes[ext] || 'application/octet-stream'
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404)
      res.end('Not Found')
      return
    }
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    })
    res.end(content)
  })
})

server.listen(PORT, () => {
  console.log(`Static server running on port ${PORT}`)
  console.log(`Serving: ${path.resolve(DIST)}`)
})
