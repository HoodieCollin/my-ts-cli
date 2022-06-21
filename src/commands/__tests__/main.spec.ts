import { handler } from '@@/commands/main';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { vol } from 'memfs';
import yaml from 'yaml';

jest.mock('inquirer');

describe('the "main" command', () => {
  test('it exists', async () => {
    expect(handler).toBeInstanceOf(Function);
  });
});
