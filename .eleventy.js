const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

const markdownIt = require('markdown-it');
const markdownItClass = require('@toycode/markdown-it-class');
const mapping = {
  h2: ['text-xl', 'font-semibold', 'capitalize', 'mt-4'],
  p: ['mt-3'],
  a: ['font-semibold', 'text-gray-700', 'hover:text-green-400'],
  em: ['text-xs', 'bg-gray-200', 'font-mono', 'py-1', 'px-2', 'rounded-sm', 'not-italic'],
  img: ['p-4', 'w-full'],
  ul: ['list-disc', 'list-inside']
};
const md = markdownIt({ linkify: true, html: true });
md.use(markdownItClass, mapping);

const moment = require('moment');
moment.locale('en');

module.exports = function (eleventyConfig) {
  // enable image copying
  eleventyConfig.setTemplateFormats(["njk", "md", "gif", "css"]);

  // lets combine array data from multiple data source in the cascade
  eleventyConfig.setDataDeepMerge(true);

  // code highlight
  eleventyConfig.addPlugin(syntaxHighlight);

  // set classes for markdown
  eleventyConfig.setLibrary('md', md);

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

  // github cname
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/admin");

  return {
      dir: {
        input: "src",
        layouts: "_layouts",
        includes: "_includes",
        output: "docs"
      }
  }
};