#! /usr/bin/env python

from pydub import AudioSegment
from pydub.playback import play
import rospy
from rtcrobot_msgs.msg import sound
from threading import Thread
import threading
import time
import sys
import ctypes 
import rospkg




class sound_control: 
    
    def __init__(self):
        self.stop_threads = False
        self.dk =''
        self.name_file=''
        self.file_audio=rospkg.RosPack().get_path('rtcrobot_webinterface')+ '/sound/'+'beep.wav'
       
        rospy.init_node('listener', anonymous=True)
    
        rospy.Subscriber("sound", sound,  self.callback)



    def run(stop): 
        while True: 
            song=AudioSegment.from_wav(self.file_audio)
            play(song)
            #print("ok")
            time.sleep(1)
            if stop(): 
                    break


    def callback(self,data):
     print data
     self.dk=data.dk
     self.name_file=data.name  
     self.file_audio=rospkg.RosPack().get_path('rtcrobot_webinterface')+ "/sound/"+self.name_file
      
    #########################################
    #########################################
    def spinOne(self):
            self.t1 = threading.Thread(target =sound_control.run, args =(lambda :  self.top_threads, )) 
            while (self.dk=='ok'):
                try:
                    self.stop_threads = False
                    self.t1.start()
                except (self.dk=='stop'):
                    stop_threads = True
                    t1.join() 
                    break #to exit out of loop, back to main program

    #########################################
    #########################################            
    def spin(self):
        #r = rospy.Rate(self.rate)
        while not rospy.is_shutdown():
            self.spinOne()    


   

           

    
    

   



    
    