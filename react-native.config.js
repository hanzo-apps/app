module.exports = {
  project: {
    ios: {
      sourceDir: './ios',
    },
    macos: {
      sourceDir: './macos',
    },
  },
  // Exclude SourcePackages from being scanned
  blacklistRE: /node_modules\/.*\/node_modules\/.*|SourcePackages\/.*/,
};