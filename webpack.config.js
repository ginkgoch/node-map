const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

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
  plugins: [
    new CopyPlugin([{
      from: 'src/plugins',
      to: 'plugins'
    }])
  ],
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
  externals: getExternals(),
  devtool: 'source-map'
};

function getExternals() {
  let externals = {};
  setExternal(externals, 'lodash', '_');
  setExternal(externals, 'ginkgoch-geom');
  setExternal(externals, 'ginkgoch-shapefile');
  setExternal(externals, 'proj4');
  setExternal(externals, 'canvas');
  setExternal(externals, 'csv-parse');
  return externals;
}

function setExternal(externalModules, moduleName, moduleRootAlias) {
  moduleRootAlias = moduleRootAlias || moduleName;
  let moduleObj = {
    commonjs: moduleName,
    commonjs2: moduleName,
    amd: moduleName,
    root: moduleRootAlias
  };

  externalModules[moduleName] = moduleObj;
}