const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { DefinePlugin } = require('webpack');

module.exports = {
  mode: 'production', // O 'development' para desarrollo
  devtool: 'inline-source-map', // Agrega source maps para depuración
  entry: {
    content: './src/content.ts',
    background: './src/background.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.css'], // Incluye .vue para resolver los archivos Vue
    alias: {
      vue: '@vue/runtime-dom', // Asegura que use el runtime DOM de Vue 3
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/], // Permite procesar TypeScript en archivos .vue
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader', // Procesa archivos .vue con vue-loader
      },
      {
        test: /\.css$/,
        use: 'raw-loader', // Importa CSS como texto
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(), // Agrega el plugin de VueLoader para procesar .vue
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/public', to: '.' }, // Copia todo el contenido de 'public' a la raíz de 'dist'
      ],
    }),
    new DefinePlugin({
      __VUE_OPTIONS_API__: JSON.stringify(true),
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false), // set to true if you want devtools in production
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(true),
    }),
  ],
};
