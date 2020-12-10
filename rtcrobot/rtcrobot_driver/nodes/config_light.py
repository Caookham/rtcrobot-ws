#!/usr/bin/env python

import rospy

from dynamic_reconfigure.server import Server
from rtcrobot_driver.cfg import Light_Config

def callback(config, level):
    rospy.loginfo("""Reconfigure Request: {state}""".format(**config))
    print config.state
    return config

if __name__ == "__main__":
    rospy.init_node("control_light", anonymous = False)
    srv = Server(Light_Config, callback)
    rospy.spin()
