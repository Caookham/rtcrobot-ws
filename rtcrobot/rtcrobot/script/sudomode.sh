#!/bin/bash

echo "Ethernet IP config"
sudo cp `rospack find rtcrobot_base`/scripts/01-netcfg.yaml  /etc/netplan
echo ""
echo "Restarting network"
echo ""
sudo netplan apply
echo "finish "
