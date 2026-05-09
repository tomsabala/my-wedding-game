const baseConfig = require('./base')

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  ...baseConfig,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
]
