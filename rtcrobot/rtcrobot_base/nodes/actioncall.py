#!/usr/bin/env python

# Copyright (c) 2015, Fetch Robotics Inc.
# Author: Michael Ferguson

import rospy
import actionlib
import rtcrobot_actions.msg

if __name__ == "__main__":
    rospy.init_node("dock_script")
    ACTION_NAME = "/savemap"
    rospy.loginfo("Connecting to %s..." % ACTION_NAME)
    client = actionlib.SimpleActionClient(ACTION_NAME, rtcrobot_actions.msg.SaveMapAction)
    client.wait_for_server()
    rospy.loginfo("Sending dock goal...")
    goal = rtcrobot_actions.msg.SaveMapGoal(map_name = "HB")
    client.send_goal(goal)
    rospy.loginfo("Done, press Ctrl-C to exit")
    rospy.spin()
