const createCover = require('../../config/create-cover');

module.exports = {
  eleventyComputed: {
    layout: "post-layout.njk",
    tags: data => [...data.tags, "post"],
    extraMetas: data => {
      const result = []
      const sitePath = createCover(data);

      result.push('<meta name="twitter:card" content="summary_large_image">');
      result.push(`<meta name="twitter:title" content="${data.title}">`);
      result.push(`<meta name="twitter:image" content="https://blog.melo.plus${sitePath}">`);

      return result;
    }
  }
};
