module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies?.ws === "8.18.0") {
        pkg.dependencies.ws = "^8.20.1";
      }
      return pkg;
    },
  },
};
