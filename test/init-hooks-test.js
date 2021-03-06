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

const { expect } = require('chai');
const { describe, it } = require('mocha');

const hook = require('../lib/framework/init-hooks.js');
const { runHook } = require('./run-hook.js');

describe('init-hooks', () => {
  it('require child_process', () => {
    expect(runHook(hook, 'init-hooks-test.js', 'child_process'))
      .to.deep.equals({
        result: require.resolve('../lib/framework/module-hooks/innocuous.js'),
        stderr: (
          'lib/framework/module-hooks/sensitive-module-hook.js:' +
          ' Blocking require("child_process") by test/init-hooks-test.js' +
          '\n\n\tUse safe/child_process.js instead.\n'),
        stdout: '',
      });
  });
  it('require package.json', () => {
    expect(runHook(hook, 'init-hooks-test.js', '../package.json'))
      .to.deep.equals({
        result: '../package.json',
        stderr: '',
        stdout: '',
      });
  });
  it('doppelgangers', () => {
    let stringifyCount = 0;
    const doppelganger = {
      toString() {
        return [ '../package.json' ][stringifyCount++] || 'child_process';
      },
    };

    expect(runHook(hook, 'init-hooks-test.js', doppelganger))
      .to.deep.equals({
        result: '../package.json',
        stderr: '',
        stdout: '',
      });
    expect(stringifyCount).to.equal(1);
  });
});
