module.exports = {
  require: ['ts-node/register'],
  extension: ['ts'],
  diff: true,
  package: "./package.json",
  spec: 'test/**/*.test.ts',
  'watch-files': ['src/**/*.ts', 'test/**/*.ts'],
  timeout: 10000
};
