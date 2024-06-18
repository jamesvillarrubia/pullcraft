module.exports = {
  require: ['ts-node/register'],
  extension: ['ts'],
  diff: true,
  reporter: 'spec',
  package: "./package.json",
  spec: 'test/**/*.test.ts',
  'watch-files': ['src/**/*.ts', 'test/**/*.ts'],
  timeout: 100000
};
