#!/usr/bin/env python

import sys
import rospy
from rtcrobot_services.srv import SSwitchLightaveMap

def service_call():
    rospy.wait_for_service('/robot_services/switchlight')
    try:
        sv_savemap = rospy.ServiceProxy('/robot_services/switchlight', SwitchLight)
        resp = sv_savemap(effect = 'L', r = 255, g = 0, b = 0)
        #return resp
    except rospy.ServiceException, e:
        print "Service call failed: %s"%e


if __name__ == "__main__":
    #rospy.init_node('service_client_test')
    service_call()