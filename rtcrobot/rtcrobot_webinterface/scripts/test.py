#!/usr/bin/env python

import rtcrobot_webinterface.maps as maps 
#import muxservice
import rospy


rospy.init_node("Mission")
map = maps.Maps()
#map.pubmaps()

rospy.spin()
