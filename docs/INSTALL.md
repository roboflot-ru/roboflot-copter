# How to control autopilot on Raspberry and Navio over intermet



## Hardware

Raspberry Pi 3B+
https://www.raspberrypi.org/products/raspberry-pi-3-model-b/

Navio 2 board
https://emlid.com/navio/


## Make SD card with OS image and configure it

Download configured Raspbian image and make initial setup from here
https://docs.emlid.com/navio2/common/ardupilot/configuring-raspberry-pi/


Configure your Raspberry

    sudo raspi-config

Test emlid tool and Navio 2 sensors

    sudo emlidtool test



## Ardupilot

Configure Ardupilot on this instruction
https://docs.emlid.com/navio2/common/ardupilot/installation-and-running/

Note UDP port on ardupilot telemetry settings, it will be used later

    TELEM1="-A udp:127.0.0.1:14550"

Reboot Raspberry and check if arducopter is running

	sudo systemctl status arducopter



## MAVProxy

We use MAVProxy to stream telemetry messages to different ports:
5761 - connect your desktop or mobile GCS using remot3.it (see below)
5762 - connect your desktop or mobile GCS over local network
5763 - used by mavlink-io-client.js to stream mavlink messages to socket.io server


Run this command on board computer and connect to it using desktop GCS (e.g. QGroundControl).
Use TCP connection with IP address of ypur raspberry and port 6762

	mavproxy.py --master=udp:127.0.0.1:14550 --out=tcpin:0.0.0.0:5762

To start mavproxy with all ports described use script:

    /scripts/mavproxy_start.sh

Make it start on boot:

    sudo chmod +x mavproxy_start.sh

Make service startup file

    sudo nano /etc/systemd/system/mavproxy.service

with content

    [Unit]
    Description=MAVProxy Service
    After=arducopter.service

    [Service]
    Type=simple
    User=pi
    WorkingDirectory=/home/pi
    ExecStart=/home/pi/copter/scripts/mavproxy_start.sh
    Restart=on-abort

    [Install]
    WantedBy=default.target


Save it with Ctrl+X, reload system services and start it

    sudo systemctl daemon-reload
    sudo systemctl enable mavproxy
    sudo systemctl start mavproxy

Check how it is working

	sudo systemctl status mavproxy

Now you can use your favourite GCS to connect (TCP) to autopilot over local network
using IP address of the board computer (Ethernet or WiFi connected) and port 5762.



## remot3.it

remote3.it is a web service which helps us to connect with board computer over internet.
It is configured to use default SSH port for remote software updates
and also 5761 port to connect desktop GCS to your autopilot over internet.

Install and configure it using this manual:
https://remot3it.zendesk.com/hc/en-us/articles/115006015367-Installing-the-remot3-it-weavedconnectd-daemon-on-your-Raspberry-Pi.

    22 - SSH
    5761 - MAVProxy (TCP port)

Now you can use your favourite GCS to connect (TCP) to autopilot over local internet
using temporary static address of your device from remot3.it



## Video streaming

To check video streaming from Raspicam you can use this instructions:

UDP streaming
https://docs.emlid.com/navio2/common/dev/video-streaming/.

TCP streaming
https://raspberrypi.stackexchange.com/questions/12156/is-it-possible-to-stream-h-264-with-rtsp-on-raspberry-pi.

You can use remot3.it to configure streaming over internet (e.g. port 5000)


To stream video over socket.io we use gstreamer to cut video into frames.

Install dependencies:

    sudo apt-get install gstreamer1.0-tools gstreamer1.0-plugins-good gstreamer1.0-plugins-bad

Check local streaming
Run on your board computer with camera connected

    raspivid -t 0 -hf -fps 25 -w 640 -h 480 -o - | gst-launch-1.0 fdsrc ! h264parse ! rtph264pay config-interval=1 pt=96 ! gdppay ! tcpserversink host=0.0.0.0 port=5001

This will make streaming TCP server on port 5001

Run on your PC (MacOS, Linux) (for Windows check links above),
replace RPI_ADDRESS with you board computer IP address:

    gst-launch-1.0 -v tcpclientsrc host=RPI_ADDRESS port=5001  ! gdpdepay !  rtph264depay ! avdec_h264 ! videoconvert ! autovideosink sync=false

A window with video streaming should open.
Ctrl+C to cancel streaming.

Using this commands you can test your video streaming with different dimensions and frame rates.


## Video streaming using socket.io

This command makes gstreamer cut video into frames and pass it to our video-io.js script

    sudo modprobe bcm2835-v4l2
    gst-launch-1.0 -v v4l2src ! video/x-raw, width=320, height=240 ! timeoverlay text="T:" shaded-background=true ! jpegenc quality=20 ! multipartmux  boundary="--videoboundary" ! tcpserversink host=0.0.0.0 port=5001

Check if it runs without errors on you board computer.

Then make startup file

    sudo nano /etc/systemd/system/raspicam.service

with content (set your desired video dimensions):

    [Unit]
    Description=raspivid
    After=network.target

    [Service]
    ExecStart=/bin/sh -c "modprobe bcm2835-v4l2 && gst-launch-1.0 -v v4l2src ! video/x-raw, width=320, height=240 ! timeoverlay text="T:" shaded-background=true ! jpegenc quality=20 ! multipartmux  boundary="--videoboundary" ! tcpserversink host=0.0.0.0 port=5001"

    [Install]
    WantedBy=default.target

Save with Ctrl+X, relaod system services and start streaming:

    sudo systemctl daemon-reload
    sudo systemctl enable raspicam
    sudo systemctl restart raspicam



## NodeJS

Install NodeJS to run javascript files on your computer:
https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs build-essential



## Roboflot-copter

Clone this repository and install dependencies

    git clone https://github.com/roboflot-ru/roboflot-copter.git copter
    cd copter
    npm install

Before running onboard scripts you will have to instal server-side components on separate computer or server.
Check https://github.com/roboflot-ru/roboflot-dashboard
Get your ROBOT_ID and server IP address and configure mavlink-io-client.js, then run

    node mavlink-io-client.js



## Autostart on boot

To run scrpts on startup we use PM2 process manager
http://pm2.keymetrics.io

Install it using command

    sudo npm install pm2 -g




## Tests

### ADC

    cd ~/Navio2/Python
    python ADC.py

Mapping between A0 - A5 and ADC:
A0 - board voltage (shows 5V)
A1 - servo rail voltage
A2 - power module voltage (ADC0, POWER port)
A3 - power module current (ADC1, POWER port)
A4 - ADC2 (ADC port)
A5 - ADC3 (ADC port)
Numbers of A0 - A5 channels correspond to ArduPilot's ADC channels.


### RCIO

    cat /sys/kernel/rcio/status/alive

RCIO is powered on and detected by Raspberry Pi if the result of above operation is 1.
0 shows that RCIO is not connected. First of all check the hardware connection between Navio2 and Raspberry Pi


### Barometer and temperature

    python Barometer.py

You should see pressure and temperature values.
Keep in mind that board tends to get hot from Raspberry and would show slightly
higher temperature than it is in your room.


### IMU

    python AccelGyroMag.py -i mpu

### GPS

    python GPS.py

### RGB LED

    sudo python LED.py

### Emlid tool

    emlidtool test



