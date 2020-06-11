module.exports = function configFiles(eleventyConfig) {
  // enable image copying
  eleventyConfig.setTemplateFormats(["njk", "md", "gif", "png"]);

  // css dir
  eleventyConfig.addPassthroughCopy("src/styles");

  // github cname
  eleventyConfig.addPassthroughCopy("src/CNAME");
}
