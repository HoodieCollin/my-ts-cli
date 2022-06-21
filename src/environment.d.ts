type LikeTrue = 'true' | 'on';
type LikeFalse = 'false' | 'off';
type BoolString = LikeTrue | LikeFalse;

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      __MY_TS_CLI___SILENT: BoolString;
      __MY_TS_CLI___PRETTY_ERRORS: BoolString;
    }
  }
}

export {};
