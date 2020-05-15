const moment = require('moment');
moment.locale('en');

module.exports = function (eleventyConfig) {
  // filters
  eleventyConfig.addFilter('dateIso', date => {
    return moment(date).toISOString();
  });
  eleventyConfig.addFilter('dateReadable', date => {
    return moment(date).format('LL'); // E.g. May 31, 2019
  });

  // collections
  eleventyConfig.addCollection("tagList", collection => {
    const tagsSet = new Set();
    collection.getAll().forEach(item => {
      if (!item.data.tags) return;
      item.data.tags
        .filter(tag => !['post', 'all'].includes(tag))
        .forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  });

  return {
      pathPrefix: "/blog/",
      dir: {
        input: "src",
        layouts: "_layouts",
        includes: "_includes",
        output: "docs"
      }
  }
};