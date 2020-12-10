#!/usr/bin/env python
from math import pow 

import rospy
import actionlib

from std_msgs.msg import String
from std_srvs.srv import Empty, EmptyResponse
from rtcrobot_services.srv import CallMission, CallMissionResponse
from rtcrobot_actions.msg import MissionAction, MissionGoal
from rtcrobot_msgs.msg import MissionState, RobotState
from sensor_msgs.msg import BatteryState
from geometry_msgs.msg import PoseStamped

from actionlib_msgs.msg import GoalID

import pymongo
from rtcrobot_fleetclient.database import DataBase as db


class MissionClient(object):
  lst_command_ = []
  
  def __init__(self):
    ACTION_NAME = "robot_mission"
    sv = rospy.Service('/robot_services/mission/load',CallMission, self.sv_loadcallback)
    rospy.loginfo("Connecting to %s..." % ACTION_NAME)
    self.client = actionlib.SimpleActionClient(ACTION_NAME, MissionAction)
    self.client.wait_for_server()

    sv = rospy.Service('/robot_services/mission/continue',Empty, self.sv_continuecallback)
    sv = rospy.Service('/robot_services/mission/pause',Empty, self.sv_pausecallback)
    sv = rospy.Service('/robot_services/mission/cancel',Empty, self.sv_cancelcallback)

    self.mssv_pub = rospy.Publisher('robot_mission/cancel', GoalID,queue_size=10)
    self.missionstate_pub = rospy.Publisher('rtcrobot/mission/state', MissionState,queue_size=10)

    self.robotstate_sub = rospy.Subscriber("rtcrobot/state", RobotState, self.stateCallback)
    self.bat_sub_ = rospy.Subscriber('rtcrobot/battery', BatteryState, self.bat_callback)
    self.robotpose_sub_ = rospy.Subscriber('rtcrobot/pose', PoseStamped, self.robotpose_callback)
    currentmap_sub = rospy.Subscriber("rtcrobot/currentmap", String, self.currentmapCallback)

    self.numcommand = len(self.lst_command_)
    self.command_idx = 0
    self.trigersendgoal = False
    self.actionrunning = False
    self.battery = BatteryState()
    self.robotpose = PoseStamped()
    self.__currentmap = ''
    self.__robotstate = RobotState()
    self.__enableFindCharger = True
    self.__percentautochargeenable = 0.0
    self.__percentautochargeend = 0.0
    self.missionstate_ = MissionState()

  def stateCallback(self, msg):
    self.__robotstate = msg

  def currentmapCallback(self, msg):
    self.__currentmap = msg.data

  def bat_callback(self,msg):
    self.battery = msg

  def robotpose_callback(self, msg):
    self.robotpose = msg

  def sv_continuecallback(self, request):
    if self.numcommand <= 0:
      return EmptyResponse()
    
    if self.command_idx == self.numcommand:
      self.command_idx = 0

    self.trigersendgoal = True

    return EmptyResponse()
  
  def sv_pausecallback(self, request):
    return EmptyResponse()

  def sv_cancelcallback(self, request):
    self.command_idx = 0
    return EmptyResponse()
  
  def sv_loadcallback(self, request):
    if(request.name == ''):
      return CallMissionResponse()

    doc = db.FindMission(request.name)
    if doc.count > 0:
      self.lst_command_ = [str(d) for d in doc[0]['actions']]
      self.missionstate_.actions = self.lst_command_
      self.numcommand = len(self.lst_command_)
      self.command_idx = 0
      print self.lst_command_
      rep = CallMissionResponse()
      rep.feedback = True
      return rep
    return CallMissionResponse()

  def done_cb(self, status, result):
    print result
    if result.done:
      self.command_idx += 1
      if self.command_idx < self.numcommand:
        self.trigersendgoal = True
      else:
        #self.command_idx = 0
        pass

      self.missionstate_.status = 1 #Normal
      self.missionstate_.decription = 'Action done'
    else:
      self.missionstate_.status = 2 #Failed
      self.missionstate_.decription = result.description

    self.actionrunning = False
    rospy.loginfo('Done action')
    pass

  def active_cb(self):
    rospy.loginfo('Active action')
    self.missionstate_.status = 1
    self.missionstate_.decription = 'Running'
    self.actionrunning = True
  
  def AutoCharge(self):
    
    if self.__robotstate.code == RobotState.CHARGING:
      return False

    elif self.__robotstate.code == RobotState.READY and self.__enableFindCharger:
      myclient = pymongo.MongoClient("mongodb://localhost:27017/")
      database = myclient["robotconfig"]
      collection = database["common"]
      doc = collection.find_one()
      self.__percentautochargeenable = doc['autoChargeenable']
      if self.battery.percentage < self.__percentautochargeenable:
        rospy.logerr('GO TO CHARGER')
        #find charge pose
        dist_min = 10000
        posename =''
        for pose in db.FindPose(type=2, map=self.__currentmap):
          #calculate distance from robot
          d = pow(pose['x'] - self.robotpose.pose.position.x,2)+pow(pose['y'] - self.robotpose.pose.position.y,2)
          if d< dist_min:
            posename = pose['name']
            dist_min = d
        rospy.loginfo("Find charger ...%s...", posename)
        goal = MissionGoal()
        goal.command = 'MOVE ' + posename
        self.client.send_goal(goal, active_cb=self.active_cb)
        self.__enableFindCharger = False
        return True
    return False

  def spin(self):
    r = rospy.Rate(10)
    while not rospy.is_shutdown():
      if self.trigersendgoal:
        issend = True
        if self.lst_command_[self.command_idx] == 'LOOP':
          #Check auto charge status. If not active loop command
          if not self.AutoCharge():
            self.command_idx = 0
        elif self.lst_command_[self.command_idx] == 'WAIT REQUEST':
          rospy.loginfo("Command ...WAIT REQUEST...")
          self.command_idx += 1
          issend = False

        if self.actionrunning:
          issend = False

        if issend:
          self.__enableFindCharger = True
          rospy.loginfo("Sending Command ...%s...",self.lst_command_[self.command_idx])
          goal = MissionGoal()
          goal.command = self.lst_command_[self.command_idx]
          self.client.send_goal(goal,done_cb=self.done_cb, active_cb=self.active_cb)
        self.trigersendgoal = False
      
      if self.command_idx == self.numcommand:
        if self.AutoCharge():
          pass

      self.missionstate_.step = self.command_idx
      self.missionstate_pub.publish(self.missionstate_)
      r.sleep()
    pass
