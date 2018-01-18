#!/usr/bin/env bash

mavproxy.py --master=udp:127.0.0.1:14651 --out=tcpin:0.0.0.0:5761  --out=tcpin:0.0.0.0:5762 --daemon