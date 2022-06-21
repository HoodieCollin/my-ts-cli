import { handler } from '@@/commands/init';
import { outputFile } from 'fs-extra';
import { vol } from 'memfs';
import { stringify } from 'yaml';

jest.mock('fs-extra');
jest.mock('yaml', () => ({
  stringify: jest.fn((obj: object) =>
    Object.entries(obj)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
  ),
}));

const mockDefaultConfig = {
  test: 'success',
};

jest.mock('@@/default-config', () => ({
  get defaultConfig() {
    return mockDefaultConfig;
  },
}));

describe('the "init" command', () => {
  beforeEach(() => {
    vol.reset();
  });

  test('outputs the default config', async () => {
    handler();

    expect(stringify).lastCalledWith(mockDefaultConfig);

    expect(outputFile).toHaveBeenCalledWith(
      expect.stringMatching(/.+\.__my-ts-cli__\.yml$/),
      'test: success',
      'utf8'
    );
  });
});
