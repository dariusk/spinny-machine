var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var Canvas = require('canvas');
var fs = require('fs');
var w = 360,
    h = 360,
    canvas = new Canvas(w, h),
    ctx = canvas.getContext('2d');
var GIFEncoder = require('gifencoder');
var encoder = new GIFEncoder(w, h);
var totalFrames = 500;
var frame = 0;
var rita = require('rita');
var lexicon = new rita.RiLexicon();
var wordfilter = require('wordfilter');
var exec = require('child_process').exec;
var snip = '/usr/bin/convert /home/dariusk/Projects/spinny-machine/myanimated.gif -matte -dither none -colors 16 -coalesce -layers optimize /home/dariusk/Projects/spinny-machine/new.gif';
function shell(command, data) {
  return new Promise((resolve, reject) => {
    exec(command,
      function (error, stdout, stderr) {
        if (error !== null) {
          console.log('exec error: ' + error);
          reject(error);
        }
        resolve({
          command: command,
          data: data
        });
    });
  });
}

var r = rita.RiTa;
// stream the results as they are available into myanimated.gif
encoder.createReadStream().pipe(fs.createWriteStream('myanimated.gif'));

encoder.start();
encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
encoder.setDelay(5);  // frame delay in ms
encoder.setQuality(1); // image quality. 10 is default.

var conf = require('./config.js');
// need to use this OTHER twitter lib to post photos, sigh
var Twitter = require('node-twitter');
var twitterRestClient = new Twitter.RestClient(
  conf.consumer_key,
  conf.consumer_secret,
  conf.access_token,
  conf.access_token_secret
);

ctx.clearRect(0,0,w,h);
var frames = 0;

function a(word) {
  var first = r.getPhonemes(word)[0];
  if (first === 'a'
    || first === 'e'
    || first === 'i'
    || first === 'o'
    || first === 'u') {
    return 'an ' + word;
  }
  else {
    return 'a ' + word;
  }
}

function word(pos) {
  return lexicon.randomWord(pos);
}

Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

var finalLine = [];

var obj = {
  x: w/2,
  y: h/2,
  r: h/8,
  tx: 0,
  ty: 0,
  zx: (Math.random()*4-2)*0.1,
  zy: (Math.random()*4-2)*0.1,
  zr: (Math.random()*4-2)*0.1,
  color: 'black',
  ang: Math.random()-0.5,
  // calculate the next position of the object
  step: function() {
    this.x += this.zx;
    this.y += this.zy;
    this.r += this.zr;
    this.tx = this.x + this.r*Math.sin(this.ang*frames);
    this.ty = this.y + this.r*Math.cos(this.ang*frames);
  },
  // draw the object
  draw: function() {
    drawLine(this.x, this.y, this.tx, this.ty, this.color);
  }
};

var obj2 = {
  x: 100,
  y: 100,
  r: h/16,
  tx: 0,
  ty: 0,
  zr: (Math.random()*4-2)*0.1,
  ang: Math.random()-0.5,
  color: '#398DE0',
  // calculate the next position of the object
  step: function() {
    this.x = obj.tx;
    this.y = obj.ty;
    this.r += this.zr;
    this.tx = this.x + this.r*Math.sin(this.ang*frames);
    this.ty = this.y + this.r*Math.cos(this.ang*frames);
  },
  // draw the object
  draw: function() {
    drawLine(this.x, this.y, this.tx, this.ty, this.color);
  }
};

var obj3 = {
  x: 100,
  y: 100,
  r: h/32,
  tx: 0,
  ty: 0,
  zr: (Math.random()*4-2)*0.1,
  noise: Math.random()*6,
  color: '#F2E528',
  ang: Math.random()-0.5,
  // calculate the next position of the object
  step: function() {
    this.x = obj2.tx;
    this.y = obj2.ty;
    this.r += this.zr;
    this.tx = this.x + this.r*Math.sin(this.ang*frames) + Math.random()*this.noise-this.noise/2;
    this.ty = this.y + this.r*Math.cos(this.ang*frames) + Math.random()*this.noise-this.noise/2;
    finalLine.push({x: this.tx, y: this.ty});
  },
  // draw the object
  draw: function() {
    drawLine(this.x, this.y, this.tx, this.ty, this.color);
  }
};

function step() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0,0,w,h);
  obj.step();
  obj2.step();
  obj3.step();
  obj.draw();
  obj2.draw();
  obj3.draw();

  for (var i = 1; i < finalLine.length; i++) {
    drawLine(finalLine[i].x, finalLine[i].y, finalLine[i-1].x, finalLine[i-1].y, 'black', 1);
  }

  encoder.addFrame(ctx);
  frames += 0.3;
}

for (var i=0; i<totalFrames; i++) {
  step();
  console.log(i);
}
encoder.finish();

setTimeout(() => { 
  shell(snip).then(() => {
    var myTweet = [
      `${a(word('jj'))} ${word('nn')}`,
      `${a(word('rb'))} ${word('jj')} ${word('nn')}`
    ].pick();
    console.log(myTweet);
    if (!wordfilter.blacklisted(myTweet)) {
      twitterRestClient.statusesUpdateWithMedia({
        'status': myTweet,
        'media[]': __dirname+'/new.gif'
      },
      function(error, result) {
        if (error) {
          console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
        }
        if (result) {
          console.log(result);
        }
      });
    }
  });
}, 2000);

// generic line draw
function drawLine(x, y, tx, ty, color, width) {
  color = color || 'black';
  width = width || 3;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(tx, ty);
  ctx.closePath();
  ctx.stroke();
}
