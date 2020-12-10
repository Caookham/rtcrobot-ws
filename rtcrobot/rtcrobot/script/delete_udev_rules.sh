#!/bin/bash

echo "delete remap the device serial port(ttyUSBX) to  devices"
echo "sudo rm   /etc/udev/rules.d/rtcboard.rules"
sudo rm   /etc/udev/rules.d/rtcboard.rules
echo "sudo rm   /etc/udev/rules.d/rplidar.rules"
sudo rm   /etc/udev/rules.d/rplidar.rules
echo "sudo rm   /etc/udev/rules.d/motordriver.rules"
sudo rm   /etc/udev/rules.d/motordriver.rules
echo "sudo rm   /etc/udev/rules.d/battery.rules"
sudo rm   /etc/udev/rules.d/battery.rules

echo " "
echo "Restarting udev"
echo ""
sudo service udev reload
sudo service udev restart
echo "finish  delete"
