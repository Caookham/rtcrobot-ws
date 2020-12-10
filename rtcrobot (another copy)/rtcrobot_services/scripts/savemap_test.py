#!/usr/bin/env python

import sys
import rospy
from rtcrobot_services.srv import SaveMap

def service_call(msg):
    rospy.wait_for_service('/roboot_services/savemap')
    try:
        sv_savemap = rospy.ServiceProxy('/roboot_services/savemap', SaveMap)
        resp = sv_savemap(msg,"Create a map")
        #return resp
    except rospy.ServiceException, e:
        print "Service call failed: %s"%e


if __name__ == "__main__":
    #rospy.init_node('service_client_test')
    service_call("abcd")