process.env.BROWSER = 'none';

if (process.env.CI === '1') {
  process.env.GENERATE_SOURCEMAP = 'false';
}
module.exports = {
  babel: {
    presets: [
      '@babel/preset-env',
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  },
};
