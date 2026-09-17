const http = require('http');

const data = JSON.stringify({
  username: 'admin',
  pin: 'wtc26',
  type: 'HO'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/employee-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
