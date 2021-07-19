module.exports = {
  eleventyComputed: {
    layout: "post-layout.njk",
    tags: data => [...data.tags, "post"],
    extraMetas: data => {
      const result = []

      result.push('<meta name="twitter:card" content="summary_large_image">');
      result.push(`<meta name="twitter:title" content="${data.title}">`);

      return result;
    }
  }
};
