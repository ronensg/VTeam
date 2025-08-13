const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Force the public path for GitHub Pages
  config.output.publicPath = '/VTeam/';
  
  // Also update the dev server public path
  if (config.devServer) {
    config.devServer.publicPath = '/VTeam/';
  }
  
  return config;
};