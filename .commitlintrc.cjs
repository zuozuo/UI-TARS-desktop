module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [0],
    'scope-enum': [2, 'always'],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'style',
        'fix',
        'docs',
        'chore',
        'refactor',
        'ci',
        'test',
        'revert',
        'perf',
      ],
    ],
  },
};
