const fs = require('fs');
const { registerFont, createCanvas } = require('canvas');

module.exports = function createCover(data) {
  if (!data.page.inputPath) return;

  const coverPath = calcCoverPath(data.page.inputPath);

  // fonts
  registerFont('./config/create-cover-noto.otf', { family: 'Noto Sans JP' })
  registerFont('./config/create-cover-roboto.ttf', { family: 'Roboto' })
  
  // dimensions used by github social preview
  const width = 1280;
  const height = 640;  
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  // bg
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, width, height);

  // create dashed border
  const margin = 40;
  context.lineWidth = 10;
  context.setLineDash([60, 10]);
  context.strokeStyle = "#1A535C"
  context.strokeRect(margin, margin, width - 2 * margin, height - 2 * margin);

  // heading
  // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text
  const heading = data.title;
  context.font = '60pt "Roboto Medium"';
  context.textAlign = 'center';
  context.fillStyle = '#000';
  context.fillText(heading, 600, 170);

  // abstract
  const abstract = 'i am a noto abstract';
  context.font = '30pt "Noto Sans JP Medium"';
  context.textAlign = 'center';
  context.fillStyle = '#000';
  context.fillText(abstract, 600, height / 2);

  // site
  const site = 'blog.melo.plus';
  context.font = '20pt "Noto Sans JP Medium"';
  context.textAlign = 'center';
  context.fillStyle = '#000';
  context.fillText(site, 600, height - margin * 2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(coverPath, buffer);

  return coverPath
};

function calcCoverPath(inputPath) {
  const dashPos = inputPath.lastIndexOf('/');
  const dotPos = inputPath.lastIndexOf('.');
  const fileName = inputPath.substring(dashPos + 1, dotPos);
  const coverPath = `${process.cwd()}\\docs\\media\\${fileName}-cover.png`;
  return coverPath;
}