#!/usr/bin/env python

import time
import rospy
import actionlib
import std_srvs.srv
from math import cos, sin

from std_msgs.msg import String
from tf.transformations import quaternion_from_euler
#from rtcrobot_actions.actions import Move, Charge,Dock
from move_base_msgs.msg import MoveBaseAction, MoveBaseGoal
from rtcrobot_actions.msg import MissionAction, MissionGoal, UnDockAction, UnDockGoal, DockAction, DockGoal
from geometry_msgs.msg import Pose, Quaternion
import rtcrobot_actions.msg
from actionlib_msgs.msg import GoalStatus, GoalID

from rtcrobot_msgs.msg import RobotState

from rtcrobot_fleetclient.database import DataBase as db

class Pose:
  def __init__(self, x = 0.0, y =0.0, theta = 0.0, posetype = 0):
    self.x = x
    self.y = y
    self.theta = theta
    self.posetype = posetype

class MissionServer(object):
  MIN_BATTERY_FIND_CHARGER = 10
  MIN_BATTERY_PERCENT_CHARGE = 80
  MIN_DISTANCE_FIND_CHARGER_IDLE = 10

  #targetpose1 = Pose(x = 14.387, y =6.466, theta = 0.007, posetype = 0, mapname = 'default')
  #targetpose2 = Pose(x = 9.53, y =5.274, theta =-1.525, posetype = 0, mapname = 'default')
  #targetpose3 = Pose(x = 5.345, y =6.100, theta = 3.138, posetype = 0, mapname = 'default')
  #targetpose4 = Pose(x = 8.4806, y =7.2922, theta = 1.615, posetype = 2, mapname = 'default')
  # create messages that are used to publish feedback/result
  _feedback = rtcrobot_actions.msg.MissionFeedback()
  _result = rtcrobot_actions.msg.MissionResult()

  def __init__(self, name):
    self._action_name = "robot_mission"
    self._as = actionlib.SimpleActionServer(self._action_name, MissionAction, execute_cb=self.execute_cb, auto_start = False)
    self.robotstate_sub = rospy.Subscriber("rtcrobot/state", RobotState, self.stateCallback)
    self.missioncancel_sub = rospy.Subscriber("robot_mission/cancel", GoalID, self.cancelCallback)
    currentmap_sub = rospy.Subscriber("rtcrobot/currentmap", String, self.currentmapCallback)


    self._as.start()
    self.__command = ''
    self.__cancel = False
    self.__isRunning = False
    self.__execute = False
    self.__isdone = 0
    self.__isdock = False
    self.__robotstate = RobotState()
    self.__currentmap = ''

  def stateCallback(self, msg):
    self.__robotstate = msg
    if self.__robotstate.code == RobotState.CHARGING or self.__robotstate.code == RobotState.DOCK:
      self.__isdock = True
    else:
      self.__isdock = False

  def cancelCallback(self, msg):
    rospy.loginfo('Cancel mission')
    self.__cancel = True

  def currentmapCallback(self, msg):
    self.__currentmap = msg.data

  def execute_cb(self, goal):
    # helper variables
    self._result.done = False
    self._feedback.status = 'Executing'
    self.__command = goal.command
    self.__isRunning = True
    self.__execute = True
    
    
    rospy.loginfo('%s: Executing "%s"', (self._action_name), self.__command)
    
    
    #self._as.publish_feedback(self._feedback)

    while not self.__isdone == 7:
      pass

    self.__isdone = 0
    self.__cancel = False
    #self._result.done = True
    rospy.loginfo('%s: Done' % (self._action_name))
    self._as.set_succeeded(self._result)

  def spin(self):
    r = rospy.Rate(10)
    while not rospy.is_shutdown():
      if self.__execute:
        self.__execute = False
        if self.__command.startswith('MOVE'):
          #get Pose by name to targetpose
          posename = self.__command.replace('MOVE','').strip()
          doc = db.FindPose(name=posename, map=self.__currentmap)
          if doc.count() == 0 :
            self._result.done = False
            self._result.description = 'Get pose failed'
            self.__isdone = 7
          else:
            posedata = doc[0]
            print posedata
            targetpose = Pose(x=posedata['x'],y=posedata['y'],theta=posedata['theta'],posetype=posedata['type'])
            self.__MovePose(targetpose)
        elif self.__command.startswith('WAIT'):
          command = self.__command.split(' ')
          if command[1] == 'TIME':
            self.__Wait(float(command[2]))
          pass
        
      r.sleep()
    pass

#region Move to Dock Action
  def __active_cb(self):
    rospy.loginfo("Goal pose is now being processed by the Action Server...")

  def __feedback_cb(self, feedback):
    #rospy.loginfo("Feedback for goal pose received")
    #rospy.loginfo(feedback)
	  pass
  def __dockdone_cb(self, status, result):
    print result
    if result.docked:
      self._result.done = True
      self._result.description = 'Action is done'
    else:
      self._result.done = False
      self._result.description = 'Dock failed'
    self.__isdone += 4
    pass

  def __done_cb(self, status, result):
    self.ismove = False
    #self.state = status
    if status == 2:
      rospy.loginfo("Goal pose received a cancel request after it started executing, completed execution!")
      self._result.done = False
      self._result.description = 'Goal pose received a cancel request after it started executing, completed execution!'
      self.__isdone = 7

    if status == 3:
      rospy.loginfo("Goal pose reached") 
      rospy.loginfo("Final goal pose reached!")
      #rospy.signal_shutdown("Final goal pose reached!")
      self._result.done = True
      self._result.description = 'Action is done'
      self.__isdone += 2
      return

    if status == 4:
      rospy.loginfo("Goal pose was aborted by the Action Server")
      #rospy.signal_shutdown("Goal pose aborted, shutting down!")
      self._result.done = False
      self._result.description = 'Goal pose was aborted by the Action Server'
      self.__isdone = 7
      return

    if status == 5:
      rospy.loginfo("Goal pose has been rejected by the Action Server")
      #rospy.signal_shutdown("Goal pose rejected, shutting down!")
      self._result.done = False
      self._result.description = 'Goal pose has been rejected by the Action Server'
      self.__isdone = 7
      return

    if status == 8:
      rospy.loginfo("Goal pose received a cancel request before it started executing, successfully cancelled!")
      self._result.done = False
      self._result.description = 'Goal pose received a cancel request before it started executing, successfully cancelled!'
      self.__isdone = 7

  def __MovePose(self, target):
    # Check robot state. If robot is docking, actice action undock
    if(self.__isdock):
      ACTION_NAME = "/undock"
      rospy.loginfo("Connecting to %s..." % ACTION_NAME)
      client = actionlib.SimpleActionClient(ACTION_NAME, UnDockAction)
      client.wait_for_server()
      rospy.loginfo("Sending dock goal...")
      goal = UnDockGoal()
      client.send_goal(goal)
      wait = client.wait_for_result()
      if not wait:
        rospy.logerr("Action server not available!")
        print self.client.get_result()
    
    self.__isdone = 1

    # After robot undock is done, active action move to targetpose
    try:
      client = actionlib.SimpleActionClient('move_base',MoveBaseAction)
      wait = client.wait_for_server(rospy.Duration(5.0))
      if not wait:
        rospy.logerr("Action server not available!")
    except:
      rospy.loginfo("Error in Programe")

    rospy.wait_for_service('/move_base_node/clear_costmaps')
    try:
      clearcostmaps = rospy.ServiceProxy('/move_base_node/clear_costmaps', std_srvs.srv.Empty)
      clearcostmaps()
                    
    except rospy.ServiceException, e:
      print "Service call failed: %s"%e
      
    time.sleep(2)
    if target.posetype != 0:
      px = target.x - 1.2*cos(target.theta) - 0.02
      py = target.y - 1.2*sin(target.theta)
    else:
      px = target.x
      py = target.y

    goal = MoveBaseGoal()
    goal.target_pose.header.frame_id = "map"
    goal.target_pose.header.stamp = rospy.Time.now() 
    goal.target_pose.pose.position.x = px
    goal.target_pose.pose.position.y = py
    goal.target_pose.pose.orientation = Quaternion(*(quaternion_from_euler(0, 0, target.theta, axes='sxyz')))
    client.send_goal(goal, self.__done_cb, self.__active_cb, self.__feedback_cb)
    wait = client.wait_for_result()
    if not wait:
      rospy.logerr("Action server not available!")
      print self.client.get_result()

    # Check pose's type. If pose's type is dock, actice action dock
    if(target.posetype != 0 and self.__isdone == 3): #Dock
      ACTION_NAME = "/dock"
      rospy.loginfo("Connecting to %s..." % ACTION_NAME)
      client = actionlib.SimpleActionClient(ACTION_NAME, DockAction)
      client.wait_for_server()
      rospy.loginfo("Sending dock goal...")
      goal = DockGoal()
      if(target.posetype == 2):
        goal.dock_type = DockGoal.CHARGER
      client.send_goal(goal, done_cb = self.__dockdone_cb)
      wait = client.wait_for_result()
      if not wait:
        rospy.logerr("Action server not available!")
        print self.client.get_result()
    else:
      self.__isdone += 4

    rospy.loginfo('#End Move')

#endregion

#region WAIT for second
  def __Wait(self, second):
    rospy.loginfo('Wait %f second', second)
    timestart = rospy.get_rostime()
    r = rospy.Rate(10)
    while rospy.get_rostime() - timestart < rospy.Duration(second) and self.__cancel == False:
      print (rospy.get_rostime() - timestart).to_sec()
      r.sleep()
      pass
    rospy.loginfo('Wait done!')

    self._result.done = True
    self.__isdone = 7
    self._result.description = 'Wait done'

#endregion