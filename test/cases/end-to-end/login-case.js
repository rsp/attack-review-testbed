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
  name: 'GET /login 404',
  requests: (baseUrl) => {
    // Test the login flow
    // 1. Request the login page.
    // 2. Submit the form with an email.
    // 3. Redirect to a page and notice that the login link now has a username.
    const loginUrl = new URL('/login', baseUrl).href;
    const loginUrlWithCont = new URL('?cont=/echo', loginUrl).href;
    const redirectLocation = new URL('/echo', baseUrl).href;

    // eslint-disable-next-line quotes
    return [
      {
        req: {
          uri: loginUrlWithCont,
          method: 'GET',
        },
        res: {
          body: [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<title>Login</title>',
            '<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0" src="/common.js">',
            '</script>',
            '<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx0">',
            '</head>',
            '<body>',
            '<h1>Login</h1>',
            '<form method="POST" action="/login" id="login">',
            '<label for="email">Email</label>',
            '<input name="email"/>',
            `<input name="cont" type="hidden" value="${ baseUrl.origin }/echo"/>`,
            '<br/>There is no password input since testing a credential store',
            'is out of scope for this attack review, and requiring',
            'credentials or using a federated service like oauth would',
            'complicate running locally and testing as different users.</form>',
            '<br/>',
            '<button type="submit" form="login">Login</button>',
            `<a href="${ baseUrl.origin }/echo">`,
            '<button type="button">Cancel</button>',
            '</a>',
            '</body>',
            '</html>',
          ],
          logs: {
            stderr: '',
            stdout: 'GET /login?cont=/echo\n',
          },
          statusCode: 200,
        },
      },
      {
        req: {
          uri: loginUrl,
          form: {
            email: 'foo@bar.com',
            cont: `${ baseUrl.origin }/echo`,
          },
          method: 'POST',
        },
        res: {
          headers: {
            location: redirectLocation,
          },
          body: [ '' ],
          logs: {
            stderr: '',
            stdout: 'POST /login\n',
          },
          statusCode: 302,
        },
      },
      {
        req: {
          uri: redirectLocation,
        },
        res: {
          body: [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<title>Database Echo</title>',
            '<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx3" src="/common.js">',
            '</script>',
            '<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx3">',
            '</head>',
            '<body>',
            '<div class="userfloat">',
            '<span class="user name">Anonymous</span>',
            '<form class="lightweight" action="/logout?cont=%2Fecho" method="POST">',
            '<button class="logoutlink" type="submit">logout</button>',
            '</form>',
            '</div>',
            '<h1>Echo</h1>',
            '<table class="echo">',
            '<tr>',
            '<th>Hello</th>',
            '</tr>',
            '<tr>',
            '<td>World</td>',
            '</tr>',
            '</table>',
            '</body>',
            '</html>',
          ],
          logs: {
            stderr: '',
            stdout: 'GET /echo\necho sending SELECT \'World\' AS "Hello"\n',
          },
          statusCode: 200,
        },
      },
    ];
  },
};