const path = require('path')

module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['dotenv/config', 'tsconfig-paths/register'],
    threads: false,
  },
}
