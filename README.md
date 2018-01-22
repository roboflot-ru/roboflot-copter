# DESCRIPTION

Install this package on your onboard or ground companion computer to control Ardupilot-based drones and rovers over Internet.
You can use any type of connection and combination (WiFi, Ethernet, 4G).

Ardupilot <=> Navio 2 <=> Raspberry Pi <=> 4G <=> socket.io <=> cloud server <=> browser


It's tested with Raspberry Pi 3 B+ and Navio 2 controller with Arducpoter 3.5.
Check docs/INSTALL.md for installation instructions.
It works with web-based GCS https://github.com/roboflot-ru/roboflot-dashboard


## mavlink-io-client.js

Reads mavlink telemetry from UDP port and transmits it to web-based GCS.
You need to configure it first in order to work. Check comments on top of file.
Then run

    node mavlink-io-client.js


## video-io.js

Reads video frames from local TCP (prepaired by Gstreamer from Raspicam) and streams them to client's browser over socket.io.
Check Video Streaming section in docs/INSTALL.md



# INSTALLATION

Check docs/INSTALL.md for installation instructions.

Clone and install from repository

    git clone https://github.com/roboflot-ru/roboflot-copter.git copter
    cd copter
    npm install


## Autostart on boot

If you are happy with this scripts, you can run them on system boot using PM2 process manager
http://pm2.keymetrics.io


