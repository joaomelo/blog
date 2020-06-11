const markdownIt = require('markdown-it');
const markdownItClass = require('@toycode/markdown-it-class');

const mapping = {
  h2: ['post-subtitle'],
  p: ['post-paragraph'],
  code: ['post-inline-code'],
  img: ['post-image'],
  ul: ['post-ul']
};
const md = markdownIt({ linkify: true, html: true });
md.use(markdownItClass, mapping);

module.exports = function setupMarkdown(eleventyConfig) {
  eleventyConfig.setLibrary('md', md);
}