#!/usr/bin/env python

import rospy
import actionlib
from rtcrobot_actions.msg import MissionAction, MissionGoal

if __name__ == "__main__":
    rospy.init_node("dock_script")
    ACTION_NAME = "/robotmission/mission1"
    rospy.loginfo("Connecting to %s..." % ACTION_NAME)
    client = actionlib.SimpleActionClient(ACTION_NAME, MissionAction)
    client.wait_for_server()
    rospy.loginfo("Sending dock goal...")
    goal = MissionGoal()
    client.send_goal(goal)
    rospy.loginfo("Done, press Ctrl-C to exit")
    rospy.spin()
