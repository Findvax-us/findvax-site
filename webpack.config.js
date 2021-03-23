const path = require("path");

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const states = ['MA', 'RI'];

const staticStatePages = states.map(state => {
  return new HtmlWebpackPlugin({
      hash: true,
      template: './src/app.html',
      filename: path.resolve(__dirname, "dist/" + state) + '/index.html'
    })
});

module.exports = {
  entry: {
    bundle: ["./src/app.js"]
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
  },

  plugins: [
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ['!*.woff2', '!*.jpg', '!*.png', '!*.gif'],
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: './src/index.html',
      filename: 'index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        './src/error.html',
        './src/browserconfig.xml',
        './src/site.webmanifest',
        {from: './src/assets/ico/*', to: 'assets/ico/[name].[ext]'},
        {from: './src/assets/img/*', to: 'assets/img/[name].[ext]'},
      ]
    })
  ].concat(staticStatePages),

  mode: "production",
  devtool: "source-map",

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  useBuiltIns: "entry",
                  corejs: 3
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        exclude: [
          /node_modules/
        ],
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(html)$/,
        use: [
          'html-loader'
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader'
        ]
      },
      {
        test: /locale\/*.\.json$/
      }
    ]
  }
}