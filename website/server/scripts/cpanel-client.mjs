import https from 'https';
import querystring from 'querystring';

export class CPanelClient {
  constructor(host, user, pass) {
    this.host = host;
    this.user = user;
    this.pass = pass;
    this.secToken = null;
    this.cookie = null;
  }

  async login() {
    const postData = querystring.stringify({ user: this.user, pass: this.pass });
    const res = await new Promise((resolve, reject) => {
      const req = https.request(`https://${this.host}:2083/login/?login_only=1`, {
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      }, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => resolve({ headers: res.headers, body: JSON.parse(body) }));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    this.secToken = res.body.security_token;
    this.cookie = (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
    return this.secToken;
  }

  async uapi(module, func, params = {}, method = 'GET') {
    if (!this.secToken) await this.login();
    const isPost = method === 'POST';
    const postBody = isPost ? querystring.stringify(params) : '';
    const query = !isPost ? querystring.stringify(params) : '';
    const url = `https://${this.host}:2083${this.secToken}/execute/${module}/${func}${query ? '?' + query : ''}`;

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method,
        rejectUnauthorized: false,
        headers: {
          Cookie: this.cookie,
          ...(isPost
            ? {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postBody),
              }
            : {}),
        },
      }, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        });
      });
      req.on('error', reject);
      if (isPost) req.write(postBody);
      req.end();
    });
  }

  async saveFile(dir, file, content) {
    return this.uapi('Fileman', 'save_file_content', { dir, file, content }, 'POST');
  }

  async getFile(dir, file) {
    return this.uapi('Fileman', 'get_file_content', { dir, file });
  }

  async listFiles(dir) {
    return this.uapi('Fileman', 'list_files', { dir });
  }
}
