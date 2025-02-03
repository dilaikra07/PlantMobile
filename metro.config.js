const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = require('node-libs-react-native');

module.exports = (() => {
    const config = getDefaultConfig(__dirname);

    config.resolver.alias = {
        '@': __dirname
    };

    return config;
})();
