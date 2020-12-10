#!/usr/bin/env python
#{"status":1,"index":1,"description":"","tyle":"save_mission","action":[{"y":495,"x":350,"type":"Move","theta":0,"Con":"A"},{"y":530,"x":430,"type":"Move","theta":0,"Con":"B"}],"name_mission":"mission 1","command":"save_mission"}
 #16:00:23

import rospy
import actionlib
from rtcrobot_actions.actions import Move, Charge,Dock
from rtcrobot_actions.msg import MissionAction, MissionGoal
import rtcrobot_actions.msg
from actionlib_msgs.msg import GoalStatus

class Mission(object):
  # create messages that are used to publish feedback/result
  _feedback = rtcrobot_actions.msg.MissionFeedback()
  _result = rtcrobot_actions.msg.MissionResult()

  def __init__(self, name):
    self._action_name = name + "/mission_test"
    self._as = actionlib.SimpleActionServer(self._action_name, MissionAction, execute_cb=self.execute_cb, auto_start = False)
    self._as.start()

  def execute_cb(self, goal):
    # helper variables
    r = rospy.Rate(1) 
    self._result.done = False
    self._feedback.status = 'Executing'
    
    rospy.loginfo('%s: Executing' % (self._action_name))
    
    move = Move(x=9.356,y=-1.487,theta=-1.632, isdock=True, docktype=1)
    while not move.run(clearcostmap = True):
      pass
      #self._as.publish_feedback(self._feedback)
    rospy.loginfo('%s: Done' % (self._action_name))
    self._as.set_succeeded(self._result)


if __name__ == '__main__':
  rospy.init_node('mission_test')
  server = Mission(rospy.get_name())
  rospy.spin()