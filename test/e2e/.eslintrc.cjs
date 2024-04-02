const path = require('path');
const synpressPath = path.join(process.cwd(), '/node_modules/@agoric/synpress');

module.exports = {
  extends: `${synpressPath}/.eslintrc.js`,
  rules: {
    'testing-library/await-async-queries': 0,
  },
};
