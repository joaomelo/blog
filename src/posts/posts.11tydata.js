const fs = require('fs');
const { createCanvas } = require('canvas');

function createCover(data) {
  if (!data.page.outputPath) {
    return;
  }

  const inputPath = data.page.inputPath;
  const dashPos = inputPath.lastIndexOf('/');
  const dotPos = inputPath.lastIndexOf('.');
  const fileName = inputPath.substring(dashPos + 1, dotPos);
  const coverPath = `${process.cwd()}\\docs\\media\\${fileName}-cover.png`;

  const width = 1200;
  const height = 600;  
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);
  const text = data.title;
  context.font = 'bold 70pt Arial';
  context.textAlign = 'center';
  context.fillStyle = '#fff';
  context.fillText(text, 600, 170);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(coverPath, buffer);

  return coverPath
};

module.exports = {
  eleventyComputed: {
    layout: "post-layout.njk",
    tags: data => [...data.tags, "post"],
    cover: data => createCover(data)
  }
};
