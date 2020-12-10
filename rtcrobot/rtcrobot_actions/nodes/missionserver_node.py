#!/usr/bin/env python

import time
import rospy
from rtcrobot_actions.missionserver import MissionServer

if __name__ == '__main__':
  rospy.init_node('mission_server')
  server = MissionServer(rospy.get_name())
  server.spin()
  rospy.spin()
