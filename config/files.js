module.exports = function configFiles(eleventyConfig) {
  // enable image copying
  eleventyConfig.setTemplateFormats(["njk", "md"]);

  // css dir
  eleventyConfig.addPassthroughCopy("src/styles");

  // media
  eleventyConfig.addPassthroughCopy("src/media");

  // github cname
  eleventyConfig.addPassthroughCopy("src/CNAME");
}
