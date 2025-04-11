// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        [
          'module-resolver',
          {
            alias: {
              '@': './', // lets "@/components/XYZ" work
            },
          },
        ],
        'expo-router/babel', // always last
      ],
    };
  };
  