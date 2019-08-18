const path = require('path');
module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'src', 'index.ts'),
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
    "ginkgoch-shapefile": {
      commonjs: "ginkgoch-shapefile",
      commonjs2: "ginkgoch-shapefile",
      amd: "ginkgoch-shapefile",
      root: "ginkgoch-shapefile"
    },
    "proj4": {
      commonjs: "proj4",
      commonjs2: "proj4",
      amd: "proj4",
      root: "proj4"
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