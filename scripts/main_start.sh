#!/usr/bin/env bash

sleep 15

bash -c "source /opt/ros/kinetic/setup.bash && rosservice call /mavros/set_stream_rate 0 1 1"
