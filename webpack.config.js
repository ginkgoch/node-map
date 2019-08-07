const path = require('path');
module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'src', 'Index.ts'),
  watch: false,
  target: "node",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "bundle.js",
    libraryTarget: "umd"
  },
  module: {
    rules: [{
      test: /.tsx?$/,
      include: [
        path.resolve(__dirname, 'src')
      ],
      exclude: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'tests'),
      ],
      loader: 'ts-loader'
    }]
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.ts']
  },
  externals: {
    "lodash": {
      commonjs: "lodash",
      commonjs2: "lodash",
      amd: "lodash",
      root: "_"
    },
    "ginkgoch-geom": {
      commonjs: "ginkgoch-geom",
      commonjs2: "ginkgoch-geom",
      amd: "ginkgoch-geom",
      root: "ginkgoch-geom"
    },
    "proj4": {
      commonjs: "proj4",
      commonjs2: "proj4",
      amd: "proj4",
      root: "proj4"
    },
    "randomcolor": {
      commonjs: "randomcolor",
      commonjs2: "randomcolor",
      amd: "randomcolor",
      root: "randomcolor"
    },
    "canvas": {
      commonjs: "canvas",
      commonjs2: "canvas",
      amd: "canvas",
      root: "canvas"
    }
  },
  devtool: 'source-map'
};