const { pathsToModuleNameMapper } = require('ts-jest');
const JSON5 = require('json5');
const { readFileSync } = require('fs-extra');

const { compilerOptions } = JSON5.parse(readFileSync('./tsconfig.json'));

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
};
