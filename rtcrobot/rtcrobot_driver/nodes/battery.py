#!/usr/bin/env python
# license removed for brevity
#import roslib
import rospy
import struct
from sensor_msgs.msg import BatteryState
import serial
import time

class BMSv4:
	
	def __init__(self, port = '/dev/battery', baudrate = 9600):
		self.pub = rospy.Publisher('rtcrobot/battery', BatteryState,queue_size=10)
		rospy.init_node('battery',anonymous=True)
		
		self.ser = serial.Serial(
		    port=port,
		    baudrate=baudrate,
		    parity=serial.PARITY_NONE,
		    stopbits=serial.STOPBITS_ONE,
		    bytesize=serial.EIGHTBITS
		)

		self.bat = BatteryState()
		self.bat.design_capacity = 105
		self.bat.power_supply_technology = self.bat.POWER_SUPPLY_TECHNOLOGY_LIPO
		self.bat.power_supply_health = self.bat.POWER_SUPPLY_HEALTH_GOOD
		self.bat.power_supply_status = self.bat.POWER_SUPPLY_STATUS_UNKNOWN
		if(self.ser.is_open):
			self.ser.write(serial.to_bytes([0xDD,0xa5,0x03,0x00,0xFF,0xFC,0x77]))
		time.sleep(0.2) 
	
	def r3(self):
		response=[None for i in range(34)]
		if(self.ser.is_open):
			try:
	    			self.ser.write(serial.to_bytes([0xDD,0xa5,0x03,0x00,0xFF,0xFD,0x77]))
	    			time.sleep(0.02)   
	    			for i in range(34): 
					response[i] = ord(self.ser.read())

	    			if response[0:3]==[221, 3, 0] :
					#print response
					self.bat.voltage = float(response[4]*255+response[5])/100
					self.bat.current = response[6]*255+response[7]
					if(self.bat.current > 32767):
						self.bat.current = float(65536 - self.bat.current) * -1
					self.bat.current = self.bat.current/100
					self.bat.capacity = float(response[8]*255+response[9])/100
					self.bat.design_capacity = float(response[10]*255+response[11])/100
					self.bat.percentage = response[23]
			except:
				self.ser.close()
				rospy.loginfo("Error")
				pass

	def r4(self):
		response=[None for i in range(23)]
		if(self.ser.is_open):
			try:
				self.ser.write(serial.to_bytes([0xDD,0xa5,0x04,0x00,0xFF,0xFC,0x77]))
				time.sleep(0.02)   
				for i in range(23) : 
					response[i] = ord(self.ser.read())
				if response[0:3]==[221, 4, 0]:
					c1 = float(response[4]*255+response[5])/1000
					c2 = float(response[6]*255+response[7])/1000
					c3 = float(response[8]*255+response[9])/1000
					c4 = float(response[10]*255+response[11])/1000
					c5 = float(response[12]*255+response[13])/1000
					c6 = float(response[14]*255+response[15])/1000
					c7 = float(response[16]*255+response[17])/1000
					c8 = float(response[18]*255+response[19])/1000
					self.bat.cell_voltage = [c1,c2,c3,c4,c5,c6,c7,c8]
			except:
				self.ser.close()
				rospy.loginfo("Error")
				pass

	def spin(self):
		r = rospy.Rate(20)
		while not rospy.is_shutdown(): 
			if(self.ser.is_open):
				self.r3()
		    		self.r4()
				self.pub.publish(self.bat) 
				r.sleep()
			else:
				try:
					self.ser.open()
				except:
					rospy.logerr("Can't open serial port")
					rospy.sleep(rospy.Duration(2.0))
		rospy.spin()
	    

if __name__ == '__main__':
  try:
	bms = BMSv4()
	bms.spin()

  except rospy.ROSInterruptException:
   pass
