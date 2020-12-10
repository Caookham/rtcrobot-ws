#!/usr/bin/env python

import rospy
from rtcrobot_navigation import mapserver

if __name__ == '__main__':
    try:
        s = mapserver.MapServer()
        s.spin()
    except rospy.ROSInterruptException:
        pass