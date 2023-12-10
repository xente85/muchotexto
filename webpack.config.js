const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production', // Configura el modo de desarrollo
  devtool: 'inline-source-map', // Agrega source maps para la depuración
  entry: {
    content: './src/content.ts',
    background: './src/background.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/public', to: '.' }, // Copia todo el contenido de la carpeta 'public' a 'dist/public'
        // Puedes agregar más configuraciones de copia según sea necesario
      ],
    }),
  ],
};