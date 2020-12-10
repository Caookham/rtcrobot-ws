#!/usr/bin/env python
# license removed for brevity
#import roslib
import rospy
import struct
from sensor_msgs.msg import Imu, BatteryState
from rtcrobot_msgs.msg import RobotBoard, RobotState
from dynamic_reconfigure.server import Server
from rtcrobot_driver.cfg import Light_Config
from rtcrobot_services.srv import SwitchLight, SwitchLightResponse

import serial
import time

class RobotBoardv1:
	def __init__(self, port = '/dev/rtcboard', baudrate = 115200):
		#rospy.init_node('robotboard',anonymous=False)
		rospy.init_node("control_light", anonymous = False)
		self.imu_pub = rospy.Publisher('imu', Imu,queue_size=1)
		self.board_pub = rospy.Publisher('rtcrobot/robotboard', RobotBoard,queue_size=1)
		self.robotstate_sub = rospy.Subscriber("rtcrobot/state", RobotState, self.stateCallback)
		#self.robotstate_pub = rospy.Publisher("rtcrobot/state", RobotState, queue_size=1)
		self.bat_sub = rospy.Subscriber("rtcrobot/battery", BatteryState, self.batteryCallback)		
        
		self.SwitchLight_srv = rospy.Service('/robot_services/switchlight', SwitchLight, self.swLightcallback)

		self.value=0
		self.__command = ''

		rospy.loginfo("Opening %s...", port)
		try:
			self.ser = serial.Serial(
			    port=port,
			    baudrate=baudrate,
			    parity=serial.PARITY_NONE,
			    stopbits=serial.STOPBITS_ONE,
			    bytesize=serial.EIGHTBITS,
			    timeout = 0.1,
			    writeTimeout = 1.0
			)
		except serial.serialutil.SerialException:
		    rospy.logerr("Can't found at port "+port + ". Did you specify the correct port?")
		    #exit
		    sys.exit(0)
		self.__battery = BatteryState()
		self.__battery_old = self.__battery
		self.__robotstate = RobotState()
		self.__boardmsgs = RobotBoard()
		srv = Server(Light_Config, self.callback)
		rospy.loginfo('Connected to board on port %s. Robot will start in 2 second...')
		time.sleep(2)

	def swLightcallback(self, rep):
		self.writeLED(e = rep.effect, r = rep.r, g = rep.g, b = rep.b)
		pass

	def stateCallback(self, msg):
		self.__robotstate = msg
		if(msg.code == RobotState.STARTING):
			self.writeLED(e = 'B', r = 255, g = 255, b = 0) #Yellow
			pass

		if(msg.code == RobotState.READY):
			self.writeLED(e = 'L', r = 0, g = 255, b = 0) #Green
			pass

		if(msg.code == RobotState.EMERGENCY):
			self.writeLED(e = 'L', r = 255, g = 0, b = 0) #Red
			pass
		
		if(msg.code == RobotState.MOVING):
			if(msg.subcode == RobotState.NORMAL):
				self.writeLED(e = 'R', r = 0, g = 255, b = 0) #Blink Green
			if(msg.subcode == RobotState.IGNORING_OBSTACLES):
				self.writeLED(e = 'B', r = 255, g = 0, b = 0) #Blink Red
			if(msg.subcode == RobotState.NO_LOCALIZATION):
				self.writeLED(e = 'B', r = 255, g = 0, b = 0) #Blink Red
			if(msg.subcode == RobotState.GOAL):
				self.writeLED(e = 'B', r = 0, g = 255, b = 0) #Round Green
			pass

		if(msg.code == RobotState.CALCULATING):
			self.writeLED(e = 'R', r = 0, g = 255, b = 255)
			pass

		if(msg.code == RobotState.MANUAL):
			self.writeLED(e = 'B', r = 245, g = 50, b = 100)
			pass

		if(msg.code == RobotState.MAPPING):
			self.writeLED(e = 'L', r = 255, g = 255, b = 255)
			pass
		
		if(msg.code == RobotState.WAIT_RESPONSE):
			self.writeLED(e = 'B', r = 255, g = 255, b = 255)
			pass

		if(msg.code == RobotState.MISSION_PAUSE):
			self.writeLED(e = 'B', r = 255, g = 255, b = 255)
			pass

		if(msg.code == RobotState.HARDWARE_ERROR):
			self.writeLED(e = 'B', r = 255, g = 0, b = 0)
			pass

		if(msg.code == RobotState.SHUTDOWN):
			self.writeLED(e = 'B', r = 0, g = 0, b = 0)
			pass

		if(msg.code == RobotState.DOCK):
			if(msg.subcode == RobotState.NORMAL):
				self.writeLED(e = 'R', r = 0, g = 255, b = 255) #Round Aqua
			if(msg.subcode == RobotState.UNDOCKING):
				self.writeLED(e = 'B', r = 0, g = 255, b = 255) #Blink Aqua
			if(msg.subcode == RobotState.DOCKING):
				self.writeLED(e = 'B', r = 0, g = 255, b = 255) #Blink Aqua
			if(msg.subcode == RobotState.DOCKED):
				self.writeLED(e = 'L', r = 0, g = 255, b = 255) #Aqua
			if(msg.subcode == RobotState.APPROACHED):
				self.writeLED(e = 'L', r = 0, g = 255, b = 255) #Aqua
			pass
		pass
	
	def batteryCallback(self, msg):
		self.__battery = msg
		#rospy.loginfo(self.__battery)
		
	
	def readIMU(self):
	    	imuMsg = Imu()
	    	# Orientation covariance estimation:
		# Observed orientation noise: 0.3 degrees in x, y, 0.6 degrees in z
		# Magnetometer linearity: 0.1% of full scale (+/- 2 gauss) => 4 milligauss
		# Earth's magnetic field strength is ~0.5 gauss, so magnetometer nonlinearity could
		# cause ~0.8% yaw error (4mgauss/0.5 gauss = 0.008) => 2.8 degrees, or 0.050 radians
		# i.e. variance in yaw: 0.0025
		# Accelerometer non-linearity: 0.2% of 4G => 0.008G. This could cause
		# static roll/pitch error of 0.8%, owing to gravity orientation sensing
		# error => 2.8 degrees, or 0.05 radians. i.e. variance in roll/pitch: 0.0025
		# so set all covariances the same.
		imuMsg.orientation_covariance = [
		0.0025 , 0 , 0,
		0, 0.0025, 0,
		0, 0, 0.0025
		]

		# Angular velocity covariance estimation:
		# Observed gyro noise: 4 counts => 0.28 degrees/sec
		# nonlinearity spec: 0.2% of full scale => 8 degrees/sec = 0.14 rad/sec
		# Choosing the larger (0.14) as std dev, variance = 0.14^2 ~= 0.02
		imuMsg.angular_velocity_covariance = [
		0.02, 0 , 0,
		0 , 0.02, 0,
		0 , 0 , 0.02
		]

		# linear acceleration covariance estimation:
		# observed acceleration noise: 5 counts => 20milli-G's ~= 0.2m/s^2
		# nonliniarity spec: 0.5% of full scale => 0.2m/s^2
		# Choosing 0.2 as std dev, variance = 0.2^2 = 0.04
		imuMsg.linear_acceleration_covariance = [
		0.04 , 0 , 0,
		0 , 0.04, 0,
		0 , 0 , 0.04
		]
		imuMsg.header.frame_id = 'imu_link'
		imuMsg.header.stamp= rospy.Time.now()
		accel_factor = 9.806 / 256.0
		#rospy.loginfo('Reading IMU data')
	    	self.ser.write(b'?IMU\n') 
		countout = 0
	    	while True:
			data = self.ser.read_until('\n',None) 
			#rospy.loginfo(data) 
			if data.startswith('IMU='):
			    	imu =data.strip().replace('IMU=','').split(' ')
				imuMsg.orientation.x = float(imu[0])
    				imuMsg.orientation.y = float(imu[1])
    				imuMsg.orientation.z = float(imu[2])
    				imuMsg.orientation.w = float(imu[3])
				
				imuMsg.linear_acceleration.x = -float(imu[5]) * accel_factor
        			imuMsg.linear_acceleration.y = float(imu[5]) * accel_factor
        			imuMsg.linear_acceleration.z = float(imu[6]) * accel_factor
				
				imuMsg.angular_velocity.x = float(imu[7])
        			imuMsg.angular_velocity.y = -float(imu[8])
        			imuMsg.angular_velocity.z = -float(imu[9])
				self.imu_pub.publish(imuMsg)
		        	break
			countout = countout + 1
			if countout > 3: 
				break

	def readDigitalInput(self):
	    countout = 0
	    self.ser.write(b'?DI\n') 
	    #time.sleep(0.02)   
	    while True:
		data = self.ser.read_until('\n',None) 
		#rospy.loginfo(data) 
		if data.startswith('DI='):
		    	di = int(data.strip().replace('DI=',''))
			self.__boardmsgs.input = [di&0x01,di&0x02,di&0x04,di&0x08,di&0x10,di&0x20,di&0x40,di&0x80]
		        break
		countout = countout + 1
		if countout > 3: 
			break
	
	def readDigitalOutput(self):
	    countout = 0
	    self.ser.write(b'?DO\n') 
	    #time.sleep(0.02)   
	    while True:
		data = self.ser.read_until('\n',None) 
		#rospy.loginfo(data) 
		if data.startswith('DO='):
		    	do = int(data.strip().replace('DO=',''))
			self.__boardmsgs.output = [di&0x01,di&0x02,di&0x04,di&0x08,di&0x10,di&0x20,di&0x40,di&0x80]
	        	break
		
		countout = countout + 1
		if countout > 3: 
			break

	def readSonar(self):
	    countout = 0
	    rospy.loginfo('Writing Sonar data')
	    self.ser.write(b'?SR\n') 
	    #time.sleep(0.02)   
	    while True:
		data = self.ser.read_until('\n',None) 
		#rospy.loginfo(data) 
		if data.startswith('SR='):
		    	sr = data.strip().replace('SR=','').split(' ')
			self.__boardmsgs.Sonar = [float(sr[0])/100,float(sr[1])/100,float(sr[2])/100,float(sr[3])/100,float(sr[4])/100,float(sr[5])/100]
	        	break
		countout = countout + 1
		if countout > 3: 
			break

	def writeLED(self, e = 'L', r= 0, g = 0, b = 0):
		#rospy.loginfo('Writing LED data')
		command = b'!LD {0} {1:0>3d} {2:0>3d} {3:0>3d}\n'
		#if( not self.__ledcurrentstate == command.format(e, r, g, b)):
		#	self.__ledcurrentstate = command.format(e, r, g, b)
		self.__command = command.format(e, r, g, b)
		#self.ser.write(command.format(e, r, g, b)) 
	
	def writeCharge(self):
	    rospy.loginfo('Writing Charge data')
	    command = b'!CH {0:0>3d}\n'
	    #rospy.loginfo(command.format(int(self.__battery.percentage)))
	    self.ser.write(command.format(int(self.__battery.percentage)))

	def callback(self,config, level):
	    rospy.loginfo("""Reconfigure Request: {state}""".format(**config))
	    e,r,g,b=config.state.split(' ')
	    self.writeLED(e = e, r = int(r), g = int(g), b = int(b))
	    return config


	def spin(self):
	    r = rospy.Rate(20)
	    #self.writeLED(self.value)
	    self.writeLED(e = 'B', r = 255, g = 255, b = 0)
	    while not rospy.is_shutdown(): 
			self.__boardmsgs = RobotBoard()
			#self.readIMU()
			#self.readSonar()
			self.readDigitalInput()
			self.board_pub.publish(self.__boardmsgs)
			if(self.__command != ''):
				self.ser.write(self.__command)
				self.__command = ''
			if self.__battery.current > 0 and self.__robotstate.code == RobotState.CHARGING:
				self.writeCharge()
				#self.__battery_old = self.__battery
				pass
			#if self.__battery.current < 0 and self.__battery_old.current >= 0: # and self.__robotstate.code != RobotState.READY:
			#	bat = RobotState()
			#	bat.code = RobotState.READY
			#	self.robotstate_pub.publish(bat)
			#	self.__battery_old = self.__battery
			#	pass
			r.sleep()
	    rospy.spin()
	    

if __name__ == '__main__':
  try:
	board = RobotBoardv1()
	board.spin()

  except rospy.ROSInterruptException:
   pass
