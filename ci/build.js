/*******************************************************************************
 *
 *    Copyright 2018 Adobe. All rights reserved.
 *    This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License. You may obtain a copy
 *    of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software distributed under
 *    the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *    OF ANY KIND, either express or implied. See the License for the specific language
 *    governing permissions and limitations under the License.
 *
 ******************************************************************************/

'use strict';

const CI = require('./ci.js');
const ci = new CI();

ci.context();

let pkg = ci.parsePackage("package.json");

ci.stage('PROVISION PROJECT');
ci.sh('npm install');

ci.stage('SECURITY AUDIT');
ci.sh('npm run audit');

if ("test" in pkg.scripts) {
    ci.stage('UNIT TESTS');
    ci.sh('mkdir -p test/results/unit');
    ci.sh('npm test');

    // Upload coverage to Codecov
    ci.sh('npm install codecov');
    ci.sh('$(npm bin)/codecov');
}

if ("test-it" in pkg.scripts) {
    ci.stage('INTEGRATION TESTS');
    ci.sh('mkdir -p test/results/integration');

    let branch = process.env.CIRCLE_BRANCH.replace(/[\W_]+/g, "");
    let buildNum = process.env.CIRCLE_BUILD_NUM.replace(/[\W_]+/g, "");
    process.env.OW_PACKAGE_SUFFIX = `common-${branch}-${buildNum}`;

    try {
        // Fix serverless permissions
        ci.sh('$(npm bin)/lerna run fix-serverless-permission');

        ci.withWskCredentials(process.env.WSK_API_HOST, process.env.CORE_WSK_NAMESPACE, process.env.CORE_WSK_AUTH_STRING, () => {
            ci.sh('$(npm bin)/lerna run deploy-suffix --concurrency 1');
        });

        ci.sh('npm run test-it');

    } finally {
        ci.withWskCredentials(process.env.WSK_API_HOST, process.env.CORE_WSK_NAMESPACE, process.env.CORE_WSK_AUTH_STRING, () => {
            ci.sh('$(npm bin)/lerna run remove-suffix --concurrency 1');
        });
    }
}

ci.stage('BUILD DONE');