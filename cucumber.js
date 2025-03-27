module.exports = {
  default: {
    // Specify the path to your feature files
    features: './features/**/*.feature',
    
    // Specify the path to your step definitions
    require: [
      './test/**/*.js'
    ],

    // Set a timeout for step definitions
    timeout: 60000
  }
};
