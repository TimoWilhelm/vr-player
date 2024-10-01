module.exports = {
  format: 'group',
  workspaces: true,
  root: true,
  upgrade: true,
  reject: [
    // breaking
    'typescript',
    'eslint',
  ],
};
