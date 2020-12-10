#!/usr/bin/env python
import serial
from time import sleep
import rospy
import roslib
from std_msgs.msg import Int32
from geometry_msgs.msg import Twist 
from rtcrobot_msgs.msg import KYDBLDriver


class KYDBL48302E():
    ser = serial.Serial('/dev/motordriver',115200)

    def pushSpeed(self,motor1 = 0,motor2 = 0):
        data = b'!M {0} {1}\r'
        self.ser.write(data.format(motor1,motor2))
	#rospy.loginfo(data)
	while True:
            data = self.ser.read_until('\r',None) 
	    #rospy.loginfo(data) 
            if len(data) > 0:
		#self.ser.flushInput()
                break 

    def getEncoder(self):
        self.ser.write(b'?C\r')
	#self.ser.reset_input_buffer() 
        while True:
            data = self.ser.read_until('\r',None) 
	    #rospy.loginfo(data) 

            if data.startswith('C='):
                enc =data.strip().replace('C=','').split(':')
		self.drv.Encoder = [int(enc[0]),int(enc[1])]
	        #self.ser.flushInput()
                break
	    #self.ser.reset_input_buffer() 
	    

    def getHallRPM(self):
        self.ser.write(b'?BS\r')
	#self.ser.reset_input_buffer() 
        while True:
            data = self.ser.read_until('\r',None) 
	    #rospy.loginfo(data) 
            if data.startswith('BS='):
		rpm =data.strip().replace('BS=','').split(':')
		self.drv.HallRPM = [int(rpm[0]),int(rpm[1])]
                break

    def getEncRPM(self):
        self.ser.write(b'?S\r')
	#self.ser.reset_input_buffer() 
        while True:
            data = self.ser.read_until('\r',None) 
	    #rospy.loginfo(data) 
            if data.startswith('S='):
		rpm =data.strip().replace('S=','').split(':')
		self.drv.EncoderRPM = [int(rpm[0]),int(rpm[1])]
                break

    def getFaultFlag(self):
        self.ser.write(b'?FF\r')
	#self.ser.reset_input_buffer() 
        while True:
            data = self.ser.read_until('\r',None) 
	    #rospy.loginfo(data) 
            if data.startswith('FF='):
		self.drv.FaultFlags =int(data.strip().replace('FF=',''))
                break

    def getStatusFlag(self):
        self.ser.write(b'?FS\r')
	#self.ser.reset_input_buffer() 
        while True:
            data = self.ser.read_until('\r',None) 
	    #rospy.loginfo(data) 
            if data.startswith('FS='):
		self.drv.StatusFlags =int(data.strip().replace('FS=',''))
                break

    def publish(self):
	self.getEncoder()
	#self.getHallRPM()
	#self.getEncRPM()
	#self.getFaultFlag()
	#self.getStatusFlag()
	#self.pub_driver.publish(self.drv)

	self.pub_lmotor.publish(int(self.drv.Encoder[0]))
        self.pub_rmotor.publish(int(self.drv.Encoder[1]))

    #############################################################
    def __init__(self):
    #############################################################
        rospy.init_node("KYDBL48302E")
        nodename = rospy.get_name()
        #rospy.loginfo("%s started" % nodename)
    
        self.w = rospy.get_param("~base_width", 0.44)
    
        self.pub_lmotor = rospy.Publisher('rtcrobot/motor_driver/lwheel', Int32, queue_size=10)
        self.pub_rmotor = rospy.Publisher('rtcrobot/motor_driver/rwheel', Int32, queue_size=10)
	self.pub_driver = rospy.Publisher('rtcrobot/motor_driver', KYDBLDriver, queue_size=10)
        rospy.Subscriber('cmd_vel', Twist, self.twistCallback)
    
    
        self.rate = rospy.get_param("rate", 50)
        self.timeout_ticks = rospy.get_param("timeout_ticks", 2)
        self.left = 0
        self.right = 0
        self.lenc = 0
        self.renc = 0
	self.drv = KYDBLDriver()

    #############################################################
    def spin(self):
    #############################################################
    
        r = rospy.Rate(self.rate)
        idle = rospy.Rate(50)
        then = rospy.Time.now()
        self.ticks_since_target = self.timeout_ticks
    
        ###### main loop  ######
        while not rospy.is_shutdown():
            while not rospy.is_shutdown() and self.ticks_since_target < self.timeout_ticks:
                self.spinOnce()
            	self.publish()
                r.sleep()
            self.publish()
            idle.sleep()
	rospy.spin()
                
    #############################################################
    def spinOnce(self):
    #############################################################
    
        # dx = (l + r) / 2
        # dr = (r - l) / w
            
        self.right = (1.0 * self.dx + self.dr * self.w / 2 ) * 848.826363
        self.left  = (1.0 * self.dx - self.dr * self.w / 2 ) * 848.826363
        # rospy.loginfo("publishing: (%d, %d)", self.left, self.right) 
                
        self.pushSpeed(self.left,self.right)
            
        self.ticks_since_target += 1

    #############################################################
    def twistCallback(self,msg):
    #############################################################
        # rospy.loginfo("-D- twistCallback: %s" % str(msg))
        self.ticks_since_target = 0
        self.dx = msg.linear.x
        self.dr = msg.angular.z
        self.dy = msg.linear.y


#############################################################
#############################################################
if __name__ == '__main__':
    """ main """
    try:
        driver = KYDBL48302E()
        driver.spin()
    except rospy.ROSInterruptException:
        pass


