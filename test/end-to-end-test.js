/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/* eslint id-blacklist: 0, no-multi-str: 0, no-magic-numbers: 0 */

const { expect } = require('chai');
const { describe, it } = require('mocha');

const path = require('path');
const process = require('process');
const request = require('request');
const { URL } = require('url');
const { startCapture, startIntercept, stopCapture, stopIntercept } = require('capture-console');
const { clearTables, initializeTablesWithTestData } = require('../lib/db-tables.js');

const { start } = require('../lib/server.js');

const hostName = '127.0.0.1';
const rootDir = path.resolve(path.join(__dirname, '..'));

function noop() {
  // This function body left intentionally blank.
}

function sessionCookieForResponse({ headers }) {
  const setCookies = headers['set-cookie'];
  if (setCookies) {
    for (const setCookie of setCookies) {
      const [ , session ] = /^session=([^;]*)/.exec(setCookie) || [];
      if (session) {
        return decodeURIComponent(session);
      }
    }
  }
  return void 0;
}

function expects(assertions, done) {
  try {
    assertions();
  } catch (exc) {
    done(exc);
    return;
  }
  done();
}

module.exports = (makePool) => {
  function withServer(onStart, { cannedData = true }) {
    let i = 0;

    // Substitute for our nonce generator, a function that produces predictable
    // output, so we don't have to deal with nonces in output.
    function notReallyUnguessable() {
      const str = `${ i++ }`;
      return 'x'.repeat(32 - str.length) + str;
    }

    const quiet = true;
    const startTrapLog = quiet ? startIntercept : startCapture;
    const stopTrapLog = quiet ? stopIntercept : stopCapture;

    function withPool() {
      return new Promise((resolve, reject) => {
        makePool().then(
          (pool) => {
            const setup = cannedData ? initializeTablesWithTestData : clearTables;
            setup(pool).then(
              () => {
                resolve(pool);
              },
              (exc) => {
                pool.end();
                reject(exc);
              });
          },
          reject);
      });
    }


    withPool().then(
      (database) => {
        let stdout = '';
        let stderr = '';
        startTrapLog(process.stdout, (chunk) => {
          stdout += chunk;
        });
        startTrapLog(process.stderr, (chunk) => {
          stderr += chunk;
        });
        const { stop } = start(
          { hostName, port: 0, rootDir, database },
          (err, actualPort) => {
            const url = new URL(`http://${ hostName }:${ actualPort }`);
            onStart(
              err, url,
              () => {
                try {
                  stop();
                  database.end();
                } finally {
                  stopTrapLog(process.stderr);
                  stopTrapLog(process.stdout);
                }
              },
              () => ({ stderr, stdout }));
          },
          notReallyUnguessable);
      },
      (dbConfigErr) => {
        onStart(dbConfigErr, new URL('about:invalid'), noop, () => ({}));
      });
  }

  function serverTest(testName, testFun, options = {}) {
    it(testName, (done) => {
      withServer(
        (startErr, url, stop, logs) => {
          let closed = false;
          function closeAndEnd(closeErr) {
            if (!closed) {
              closed = true;
              stop(closeErr);
              if (closeErr) {
                return done(closeErr);
              }
              return done();
            }
            return null;
          }
          if (startErr) {
            closeAndEnd(startErr);
            return;
          }
          try {
            testFun(url, closeAndEnd, logs);
          } catch (exc) {
            closeAndEnd(exc);
            throw exc;
          }
        },
        options);
    });
  }

  describe('end-to-end', () => {
    serverTest('GET / OK', (baseUrl, done, logs) => {
      const homePageUrl = `/?now=${ Number(new Date('2018-10-12 12:00:00')) }`;
      request(
        new URL(homePageUrl, baseUrl).href,
        (err, response, body) => expects(
          () => {
            expect({
              err,
              statusCode: response && response.statusCode,
              body: body.replace(/<li\b/g, '\n<li').split(/\n/g),
              logs: logs(),
            }).to.deep.equal({
              err: null,
              body: [
                '<!DOCTYPE html><html><head><title>Attack Review Testbed</title>\
<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0" src="/common.js"></script>\
<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0">\
</head><body>\
<div class="banner view-as-public"></div>\
<h1>Recent Posts</h1>\
<ol class="posts">',
                '<li>\
<span class="author name">Ada</span>\
<span class="created">a week ago</span>\
<div class="body">Hi!  My name is <b>Ada</b>.  Nice to meet you!</div>\
</li>',
                '<li>\
<a class="author name" href="about:invalid#TrustedURL">Bob</a>\
<span class="created">6 days ago</span>\
<div class="body">Ada, !</div>\
</li>',
                '<li>\
<a class="author name" href="https://deb.example.com/"><b>D</b>eb</a>\
<span class="created">5 days ago</span>\
<div class="body"><b>¡Hi, all!</b></div>\
</li>',
                '<li>\
<a class="author name" href="mailto:fae@fae.fae"><font color="green">Fae</font></a>\
<span class="created">3 days ago</span>\
<div class="body">Sigh!  Yet another <a href="//Facebook.com">Facebook.com</a> knockoff without any users.</div>\
</li>',
                '<li>\
<a class="author name" href="mailto:fae@fae.fae"><font color="green">Fae</font></a>\
<span class="created">2 days ago</span>\
<div class="body">(It is probably insecure)</div>\
</li>\
\
</ol>\
</body></html>',
              ],
              logs: {
                stderr: '',
                stdout: `GET ${ homePageUrl }\n`,
              },
              statusCode: 200,
            });
            expect(sessionCookieForResponse(response)).to.not.equal(void 0);
          }, done),
        { cannedData: true });
    });

    // A static HTML file under ../static
    serverTest('GET /hello-world.html OK', (baseUrl, done, logs) => {
      request(
        new URL('/hello-world.html', baseUrl).href,
        (err, response, body) => expects(
          () => {
            expect({
              err,
              statusCode: response && response.statusCode,
              body,
              logs: logs(),
            }).to.deep.equal({
              err: null,
              statusCode: 200,
              body: '<!doctype html>\nHello, World!\n',
              logs: {
                stderr: '',
                stdout: '',
              },
            });
          }, done));
    });

    serverTest('GET /no-such-file 404', (baseUrl, done, logs) => {
      const target = new URL('/no-such-file', baseUrl).href;
      request(
        target,
        (err, response, body) => expects(
          () => {
            expect({
              err,
              statusCode: response && response.statusCode,
              body,
              logs: logs(),
            }).to.deep.equal({
              err: null,
              statusCode: 404,
              body: `<!DOCTYPE html><html><head><title>File Not Found:
/no-such-file</title>\
<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0" src="/common.js"></script>\
<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0">\
</head><body><p>Oops!  Nothing at
${ target }</p></body></html>`,
              logs: {
                stderr: '',
                stdout: 'GET /no-such-file\n',
              },
            });
          }, done));
    });

    serverTest('GET /echo OK', (baseUrl, done, logs) => {
      const target = new URL('/echo?a%22=b%27&foo=bar&baz', baseUrl).href;
      request(
        target,
        (err, response, body) => expects(
          () => {
            expect({
              err,
              statusCode: response && response.statusCode,
              body,
              logs: logs(),
            }).to.deep.equal({
              err: null,
              statusCode: 200,
              // eslint-disable-next-line quotes
              body: `<!DOCTYPE html><html><head><title>Database Echo</title>\
<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0" src="/common.js"></script>\
<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0">\
</head><body>\
<h1>Echo</h1>\
<table class="echo">\
<tr><th>a&#34;</th><th>foo</th><th>baz</th></tr>\
<tr><td>b&#39;</td><td>bar</td><td></td></tr>\
</table></body></html>`,
              logs: {
                stderr: '',
                stdout: (
                  'GET /echo?a%22=b%27&foo=bar&baz\n' +
                    'echo sending SELECT e\'b\'\'\' AS "a""", \'bar\' AS "foo", \'\' AS "baz"\n'),
              },
            });
          }, done));
    });
  });
};
