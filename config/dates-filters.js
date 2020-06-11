const moment = require('moment');
moment.locale('en');

module.exports = function setDateFilters(eleventyConfig) {
  eleventyConfig.addFilter('dateIso', date => {
    return moment.utc(date).toISOString();
  });
  eleventyConfig.addFilter('dateReadable', date => {
    return moment.utc(date).format('LL'); // E.g. May 31, 2019
  });
}