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

const chai = require('chai');
const assert = chai.assert;
const ArgsTransformer = require('../../src/graphql/ArgsTransformer');

describe('ArgsTransformer', () => {

    let transformerFunctions = {
        offset: (args) => {
            let defaultOffset = 0;
            if (!args.offset || args.offset < 0) {
                args.offset = defaultOffset;
            }
        },
        limit: (args) => {
            let defaultLimit = 10;
            if (args.limit && args.limit < 0) {
                args.limit = defaultLimit;
            }
        },
        currentPage: (args) => {
            args.currentPage = args.offset;
        }
    };
    
    let checkFields = {
        searchProducts: ['offset', 'currentPage']
    };
    
    let transformer = new ArgsTransformer(transformerFunctions, checkFields, '_args');

    it("transforms arguments as defined and doesn't modify the rest", () => {
        let limit = -12;
        let offset = 12;
        let obj = {
            search: {
                _args: {
                    text: "meskwielt",
                    limit: limit,
                    offset: offset
                }
            }
        };

        let expectedArgs = {
            text: "meskwielt",
            limit: limit,
            offset: offset
        };

        transformerFunctions.limit(expectedArgs);
        transformerFunctions.offset(expectedArgs);

        transformer.transform(obj.search);
        assert.hasAllKeys(obj.search, '_args');
        assert.hasAllKeys(obj.search._args, expectedArgs);
        let args = obj.search._args;
        assert.deepEqual(args, expectedArgs);
    });

    it('transforms arguments of entire object', () => {
        let offset = -2;

        let obj = {
            result: {
                somethingElse: {
                    _args: {
                        offset: offset
                    }
                },
            }
        };

        let expectedArgs = {
            offset: offset
        };

        transformerFunctions.offset(expectedArgs);

        transformer.transformRecursive(obj);

        assert.hasAllKeys(obj, 'result');
        assert.hasAllKeys(obj.result, 'somethingElse');
        assert.hasAllKeys(obj.result.somethingElse, '_args');
        let args = obj.result.somethingElse._args;
        assert.hasAllKeys(args, expectedArgs);
        assert.deepEqual(args, expectedArgs);
    });

    it('checks all obligatory Args for obligatory Fields and still transforms the rest of the present args', () => {
        let obj = {
            _args: {
                offset: -23,
                limit: -23
            }
        };

        let expectedArgs = {
            limit: 10,
            offset: 0,
            currentPage: 0
        };

        transformer.transform(obj, 'searchProducts');
        assert.hasAllKeys(obj._args, expectedArgs);
        assert.deepEqual(obj._args, expectedArgs);
    });
});