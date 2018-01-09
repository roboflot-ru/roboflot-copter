#!/usr/bin/env bash

bash -c "source /opt/ros/kinetic/setup.bash && rosrun mavros mavros_node _fcu_url:=udp://:14650@"
