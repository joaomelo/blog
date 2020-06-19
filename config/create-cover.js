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

  // text general
  context.textAlign = 'center';
  context.fillStyle = '#1A535C';
  const textCenter = width / 2;
  const textWidth = width - (4 * margin);

  context.font = '60pt "Roboto Medium"';
  fillText(context, data.title, textCenter, margin * 4, textWidth);

  context.font = '20pt "Noto Sans JP Medium"';  
  fillText(context, data.abstract, textCenter, height * (3/5), textWidth);
  fillText(context, 'blog.melo.plus', textCenter, height - margin * 2, textWidth);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(coverPath, buffer);

  return calcSitePath(data.page.inputPath);
};

function calcCoverPath(inputPath) {
  const coverPath = `${process.cwd()}\\docs${calcSitePath(inputPath)}`;
  return coverPath;
};

function calcSitePath(inputPath) {
  const dashPos = inputPath.lastIndexOf('/');
  const dotPos = inputPath.lastIndexOf('.');
  const fileName = inputPath.substring(dashPos + 1, dotPos);
  const sitePath = `\\media\\${fileName}-cover.png`;
  return sitePath;  
};

function fillText(ctx, text, x, y, maxWidth) {
  const lineGap = 10;
  const fontHeight = parseInt(ctx.font.match(/\d+/), 10);
  const lineHeight =  fontHeight + lineGap;
  const wrapedText = parseLines(ctx, text, maxWidth);
  wrapedText.forEach((line, i) => ctx.fillText(line, x, y + (i * lineHeight)));
};

function parseLines(ctx, text, maxWidth) {
  var words = text.split(" ");
  var lines = [];
  var currentLine = words[0];

  for (var i = 1; i < words.length; i++) {
      var word = words[i];
      var width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
          currentLine += " " + word;
      } else {
          lines.push(currentLine);
          currentLine = word;
      }
  }
  lines.push(currentLine);
  return lines;
}