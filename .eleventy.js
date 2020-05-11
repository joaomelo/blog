const moment = require('moment');
moment.locale('en');

module.exports = function (eleventyConfig) {
 
  eleventyConfig.addFilter('dateIso', date => {
    return moment(date).toISOString();
  });
 
  eleventyConfig.addFilter('dateReadable', date => {
    return moment(date).format('LL'); // E.g. May 31, 2019
  });

  eleventyConfig.addPassthroughCopy("css");

  return {
    dir: {
      input: "src",
      output: "docs"
    }
  }
};

