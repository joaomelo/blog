const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const moment = require('moment');
moment.locale('en');

module.exports = function (eleventyConfig) {
  // lets combine array data from multiple data source in the cascade
  eleventyConfig.setDataDeepMerge(true);

  // code highlight
  eleventyConfig.addPlugin(syntaxHighlight);

  // filters
  eleventyConfig.addFilter('dateIso', date => {
    return moment.utc(date).toISOString();
  });
  eleventyConfig.addFilter('dateReadable', date => {
    return moment.utc(date).format('LL'); // E.g. May 31, 2019
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