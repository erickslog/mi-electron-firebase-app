// eslint.config.js
module.exports = [
    {
    ignores: ["node_modules/"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...require("globals").browser,
        ...require("globals").node,
      },
    },
    rules: {
      // Add your custom rules here
    },
  },
];