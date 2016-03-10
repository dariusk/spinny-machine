run server this way


    node stream-server.js test

stream a test video: ffmpeg -f lavfi -i testsrc=size=640x480 -pix_fmt yuv420p -f mpeg1video -b 800k -r 30 http://localhost:8082/test/640/480/

...or go to ~/Projects/genvideo and run `node index.js`

go to http://localhost/jsmpeg/stream-example.html


DO THIS instead node index.js | ffmpeg -loop 1 -f image2pipe -i pipe:0 -re -f lavfi -i aevalsrc=0 -f mpeg1video -b 800k -r 30 http://localhost:8082/test/640/480
