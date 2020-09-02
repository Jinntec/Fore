import commonjs from '@rollup/plugin-commonjs'

export default {
    input: './src/fonto/parseExpression.js',
    output: {
        file: './assets/parseExpression.esm.js',
        format: 'es',
    },
    plugins: [
        commonjs({
            namedExports: {
                'parseExpression': ['parseExpression']
            }
        })
    ],
}