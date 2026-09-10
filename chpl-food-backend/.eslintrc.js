module.exports = {
    env: {
        commonjs: true,
        es2021: true,
        node: true,
    },

    plugins: ['prettier'],
    extends: ['eslint:recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    rules: {
        'no-unused-vars': ['error', { vars: 'all', args: 'none', ignoreRestSiblings: false }],
        indent: 'off',
    },
};
