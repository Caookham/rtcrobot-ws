#!/usr/bin/env python

import rospy
import actionlib
from rtcrobot_actions.missionclient import MissionClient

if __name__ == "__main__":
    rospy.init_node("mission_client")
    missionclient = MissionClient()
    missionclient.spin()
    rospy.spin()
