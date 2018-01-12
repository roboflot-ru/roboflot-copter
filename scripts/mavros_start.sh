#!/usr/bin/env bash

sleep 10

bash -c "source /opt/ros/kinetic/setup.bash && rosrun mavros mavros_node _fcu_url:=udp://:14650@"
