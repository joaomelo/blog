const createCover = require('../../config/create-cover');

module.exports = {
  eleventyComputed: {
    layout: "post-layout.njk",
    tags: data => [...data.tags, "post"],
    cover: data => createCover(data)
  }
};
