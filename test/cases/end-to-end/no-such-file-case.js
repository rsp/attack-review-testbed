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

/* eslint array-element-newline: 0 */

const { URL } = require('url');

module.exports = {
  requests: (baseUrl) => [
    {
      req: {
        uri: new URL('/no-such-file', baseUrl).href,
      },
      res: {
        body: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '<title>File Not Found:',
          '/no-such-file</title>',
          '<script src="/common.js" nonce="xxxx0">',
          '</script>',
          '<link rel="stylesheet" href="/styles.css" nonce="xxxx0">',
          '</head>',
          '<body>',
          '<div class="userfloat">',
          '<a class="loginlink" href="/login">login</a>',
          '</div>',
          '<h1>404</h1>',
          '<p>Oops!  Nothing at',
          `${ baseUrl.origin }/no-such-file</p>`,
          '</body>',
          '</html>',
        ],
        logs: {
          stderr: '',
          stdout: 'GET /no-such-file\n',
        },
        statusCode: 404,
      },
    },
  ],
};
