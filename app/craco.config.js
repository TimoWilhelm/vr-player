const { DefinePlugin } = require('webpack');

process.env.BROWSER = 'none';

if (process.env.CI === '1') {
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.PUBLIC_URL = `https://${process.env.REACT_APP_VERCEL_URL}`;
}

// TODO: https://github.com/pmndrs/jotai/issues/965
module.exports = {
  webpack: {
    plugins: [
      new DefinePlugin({
        process: JSON.stringify({}),
      }),
    ],
  },
};
