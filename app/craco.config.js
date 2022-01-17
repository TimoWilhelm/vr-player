const { DefinePlugin } = require('webpack');

process.env.BROWSER = 'none';

if (process.env.CI === '1') {
  process.env.GENERATE_SOURCEMAP = 'false';
}
