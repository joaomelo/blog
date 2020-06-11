module.exports = function (eleventyConfig) {
  // lets combine array data from multiple data source in the cascade
  eleventyConfig.setDataDeepMerge(true);

  // code highlight
  const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
  eleventyConfig.addPlugin(syntaxHighlight);

  // set classes for markdown
  const setupMarkdown = require('./config/markdown');
  setupMarkdown(eleventyConfig);

  // add date filters
  const setDateFilters = require('./config/dates-filters');
  setDateFilters(eleventyConfig);
  
  // tags
  const createTagList = require('./config/tags');
  createTagList(eleventyConfig);
  
  // files movement configurations
  const configFiles = require('./config/files');
  configFiles(eleventyConfig);  

  return {
      dir: {
        input: "src",
        layouts: "_layouts",
        includes: "_includes",
        output: "docs"
      }
  }
};