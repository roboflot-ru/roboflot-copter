#!/usr/bin/env bash

source /opt/ros/kinetic/setup.bash &&
roscore &
sleep 10 &&
rosrun mavros mavros_node _fcu_url:=udp://:14650@ &
sleep 15 &&
rosservice call /mavros/set_stream_rate 0 1 1
