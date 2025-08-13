const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Fix the public path for GitHub Pages
  config.output.publicPath = '/VTeam/';
  
  return config;
};
