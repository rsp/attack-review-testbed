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
  name: 'GET /account, POST /login, POST /account, GET /echo, GET /account',
  requests: (baseUrl) => [
    {
      req: {
        uri: new URL('/account?cont=/', baseUrl),
      },
      res: {
        body: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '<title>Login</title>',
          '<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2" src="/common.js">',
          '</script>',
          '<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx2">',
          '</head>',
          '<body>',
          '<h1>Login</h1>',
          '<form method="POST" action="/login" id="login">',
          '<label for="email">Email</label>',
          '<input name="email"/>',
          `<input name="cont" type="hidden" value="${ baseUrl.origin }/account?cont=/"/>`,
          '<br/>There is no password input since testing a credential store',
          'is out of scope for this attack review, and requiring',
          'credentials or using a federated service like oauth would',
          'complicate running locally and testing as different users.</form>',
          '<br/>',
          '<button type="submit" form="login">Login</button>',
          `<a href="${ baseUrl.origin }/account?cont=/">`,
          '<button type="button">Cancel</button>',
          '</a>',
          '</body>',
          '</html>',
        ],
        logs: {
          stdout: 'GET /account?cont=/\nGET /login?cont=%2Faccount%3Fcont%3D%2F\n',
        },
      },
    },
    {
      req: {
        uri: new URL('/login', baseUrl),
        method: 'POST',
        form: {
          cont: `${ baseUrl.origin }/account?cont=/`,
          email: 'me@example.com',
        },
      },
      res: {
        body: [ '' ],
        logs: {
          stdout: 'POST /login\n',
        },
        headers: {
          location: `${ baseUrl.origin }/account?cont=/`,
        },
        statusCode: 302,
      },
    },
    {
      req: {
        uri: new URL(`${ baseUrl.origin }/account?cont=/`),
      },
      res: {
        body: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '<title>Edit Account</title>',
          '<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5" src="/common.js">',
          '</script>',
          '<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5">',
          '</head>',
          '<body>',
          '<div class="userfloat">',
          '<span class="user name">Anonymous</span>',
          '<form class="lightweight" action="/logout?cont=%2Faccount%3Fcont%3D%2F"' +
            ' method="POST" name="logout">',
          '<button class="logoutlink" type="submit">logout</button>',
          '</form>',
          '</div>',
          // Form filled with default content from newly created account.
          '<form name="account" method="post" action="/account">',
          '<table class="formatting">',
          '<tr>',
          '<td colspan="2">',
          '<h1>Public Profile</h1>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td>',
          '<label for="displayName">Display Name</label>',
          '</td>',
          '<td>',
          // Newly created user has no display name
          '<input name="displayName" value="Anonymous"/>',
          '<input name="displayNameIsHtml" type="checkbox"/>',
          '<label for="displayNameIsHtml">HTML</label>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td>',
          '<label for="publicUrl">Public URL</label>',
          '</td>',
          '<td>',
          '<input name="publicUrl" value=""/>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td colspan="2">',
          '<h1>Private Profile</h1>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td>',
          '<label for="realName">Real Name</label>',
          '</td>',
          '<td>',
          '<input name="realName"/>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td>',
          '<label for="email">Email</label>',
          '</td>',
          '<td>',
          '<input name="email" value="me@example.com"/>',
          '</td>',
          '</tr>',
          '</table>',
          '<input name="cont" type="hidden" value="/"/>',
          '</form>',
          '<button form="account" type="submit">Submit</button>',
          '<a href="/">',
          '<button type="button">Cancel</button>',
          '</a>',
          '</body>',
          '</html>',
        ],
        logs: {
          stdout: 'GET /account?cont=/\n',
        },
      },
    },
    {
      req: {
        uri: new URL(`${ baseUrl.origin }/account?cont=/`),
        method: 'POST',
        form: {
          displayName: '<b>Firstname</b>123',
          displayNameIsHtml: 'on',
          publicUrl: 'http://example.com/~flastname',
          realName: 'Firstname Lastname',
          email: 'me@example.com',
        },
      },
      res: {
        body: [ '' ],
        logs: {
          stdout: 'POST /account?cont=/\n',
        },
        statusCode: 302,
      },
    },
    {
      req: {
        uri: new URL(`${ baseUrl.origin }/?count=1`),
      },
      res: {
        body: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '<title>Attack Review Testbed</title>',
          '<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx7" src="/common.js">',
          '</script>',
          '<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx7">',
          '</head>',
          '<body>',
          '<div class="userfloat">',
          '<span class="user name">',
          '<b>Firstname</b>123</span>',
          '<form class="lightweight" action="/logout?cont=%2F%3Fcount%3D1" method="POST" name="logout">',
          '<button class="logoutlink" type="submit">logout</button>',
          '</form>',
          '</div>',
          '<div class="banner view-as-public">',
          '</div>',
          '<h1>Recent Posts</h1>',
          '<ol class="posts">',
          '<li>',
          '<span class="author name">Ada</span>',
          '<span class="created">2 weeks ago</span>',
          '<div class="body">Hi!  My name is <b>Ada</b>.  Nice to meet you!</div>',
          '<div class="images">',
          '<a class="usercontent" href="smiley.png">',
          '<img src="smiley.png"/>',
          '</a>',
          '</div>',
          '</li>',
          '</ol>',
          '</body>',
          '</html>',
        ],
        logs: {
          stdout: 'GET /?count=1\n',
        },
      },
    },
    {
      req: {
        uri: new URL(`${ baseUrl.origin }/account`),
      },
      res: {
        body: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '<title>Edit Account</title>',
          '<script nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx8" src="/common.js">',
          '</script>',
          '<link rel="stylesheet" href="/styles.css" nonce="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx8">',
          '</head>',
          '<body>',
          '<div class="userfloat">',
          '<span class="user name">',
          // Changed display name
          '<b>Firstname</b>123</span>',
          '<form class="lightweight" action="/logout?cont=%2Faccount"' +
            ' method="POST" name="logout">',
          '<button class="logoutlink" type="submit">logout</button>',
          '</form>',
          '</div>',
          '<form name="account" method="post" action="/account">',
          '<table class="formatting">',
          '<tr>',
          '<td colspan="2">',
          '<h1>Public Profile</h1>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td>',
          '<label for="displayName">Display Name</label>',
          '</td>',
          '<td>',
          // Changed display name
          '<input name="displayName" value="&lt;b&gt;Firstname&lt;/b&gt;123"/>',
          '<input name="displayNameIsHtml" checked="checked" type="checkbox"/>',
          '<label for="displayNameIsHtml">HTML</label>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td>',
          '<label for="publicUrl">Public URL</label>',
          '</td>',
          '<td>',
          // Changed public URL
          '<input name="publicUrl" value="http://example.com/~flastname"/>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td colspan="2">',
          '<h1>Private Profile</h1>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td>',
          '<label for="realName">Real Name</label>',
          '</td>',
          '<td>',
          // Changed real name
          '<input name="realName" value="Firstname Lastname"/>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td>',
          '<label for="email">Email</label>',
          '</td>',
          '<td>',
          '<input name="email" value="me@example.com"/>',
          '</td>',
          '</tr>',
          '</table>',
          '<input name="cont" type="hidden" value="/"/>',
          '</form>',
          '<button form="account" type="submit">Submit</button>',
          '<a href="/">',
          '<button type="button">Cancel</button>',
          '</a>',
          '</body>',
          '</html>',
        ],
        logs: {
          stdout: 'GET /account\n',
        },
      },
    },
  ],
};
