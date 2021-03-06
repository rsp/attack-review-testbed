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

/**
 * @fileoverview
 * Exports a require function that should not be granted any privilege.
 */

const logged = new Set();

module.exports = Object.freeze(
  // eslint-disable-next-line prefer-arrow-callback
  function unprivilegedRequire(x, who) {
    if (!logged.has(x)) {
      logged.add(x);
      // eslint-disable-next-line no-console
      console.trace(who);
    }
    // eslint-disable-next-line global-require
    return require(x);
  });
