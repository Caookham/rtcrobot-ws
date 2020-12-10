#!/bin/bash

echo "Start setup upstart robot"
sudo cp `rospack find rtcrobot_base`/scripts/roscore.service  /etc/systemd/system
sudo systemctl enable roscore.service
sudo cp `rospack find rtcrobot_base`/scripts/rtcrobot.service  /etc/systemd/system
sudo systemctl enable rtcrobot.service
sudo cp `rospack find rtcrobot_base`/scripts/env.sh  /etc/ros
sudo chmod 755 /etc/ros/env.sh
sudo cp `rospack find rtcrobot_base`/scripts/roslaunch  /usr/sbin
sudo chmod 755 /usr/sbin/roslaunch

echo "finish "
