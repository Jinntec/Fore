import commonjs from 'plugin-commonjs'

export default {
    input: './node_modules/fontoxpath/dist/fontoxpath.js',
    output: {
        file: './assets/fontoxpath.esm.js',
        format: 'es',
    },
    plugins: [
        commonjs({
            namedExports: {
                'fontoxpath': ['fontoxpath']
            }
        })
    ],
}