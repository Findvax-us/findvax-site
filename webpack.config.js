const path = require("path");

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    bundle: ["./src/index.js"]
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
  },

  plugins: [
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ['!*.woff2', '!*.jpg', '!*.png', '!*.gif', '!*.svg'],
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: './src/index.html',
      filename: 'index.html'
    })
  ],

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
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
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