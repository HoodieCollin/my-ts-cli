const parseBoolString = (str: string | undefined, fallback: boolean) =>
  typeof str === 'string' ? /^(true|on)$/i.test(str.trim()) : fallback;

const { __MY_TS_CLI___SILENT, __MY_TS_CLI___PRETTY_ERRORS } = process.env;

export const env = {
  silent: parseBoolString(__MY_TS_CLI___SILENT, false),
  pretty_errors: parseBoolString(__MY_TS_CLI___PRETTY_ERRORS, true),
};
