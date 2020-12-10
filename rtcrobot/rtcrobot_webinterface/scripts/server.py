#!/usr/bin/env python

import rospkg
import rospy
import json
import shutil
import glob
import base64
import random
import yaml
import subprocess
import roslaunch
import time
import os, sys, stat
import multiprocessing
import string
import cv2
import numpy as np
from os import walk
import pymongo

from copy import deepcopy


from tornado import web, ioloop, websocket, escape
from tornado.options import define, options

from rtcrobot_fleetclient.database import DataBase as db


import rtcrobot_webinterface.maps as maps
import rtcrobot_webinterface.get_sound as get_sound

from rtcrobot_msgs.msg import RobotMode
from rtcrobot_services.srv import SaveMap

from threading import Thread
import threading

clientlist_ =[]
connections =[]
mapspath_ = rospkg.RosPack().get_path('rtcrobot_navigation')+'/maps'
nameDash = "Default"
choose_mission=''




class BaseHandler(web.RequestHandler):
    """
    Base handler gonna to be used instead of RequestHandler
    """
    def write_error(self, status_code, **kwargs):
        if status_code in [403, 404, 500, 503]:
            self.write('Error %s' % status_code)
        else:
            self.write('BOOM!')


class MainHandler(BaseHandler):
    def get(self):
        f = open(rospkg.RosPack().get_path('rtcrobot_webinterface')+"/json/mission.json", "r")
        a = f.read()
        b = json.loads(a)
        length = len(b["list"])
        arr_name = []
        arr_des = []
        arr_color = []
        card = []
        print b["list"]
        for i in range(length):
            arr_name.insert(i,b["list"][i]["name_mission"])
            arr_des.insert(i,b["list"][i]["tyle"])
            arr_color.insert(i,random_color())
            #card.insert(i,"card"+i)
            
        self.render('../www/dashboard_index.html',length = length, arr_name = arr_name, arr_des = arr_des, color = arr_color )

def random_color():
    arr_color = ["text-muted", "text-primary","text-success","text-info","text-warning","text-danger","text-secondary",
    "text-dark","text-body"]
    index = random.randint(0, 8)
    return arr_color[index]  

#---------------kien modified-----------------------------------------------#

class  CreateDashboardHandler(web.RequestHandler):
    def get(self):
        arr_name = []
        mission=db.FindMission()
        i=0
        for ms in mission:

                name_mission=ms['name']
                arr_name.insert(i,name_mission)
                i=i+1 
                    
        length = i 
        self.render('../www/dashboard_create.html',length = length, arr_name = arr_name )

class Dashboard(websocket.WebSocketHandler):
    def check_origin(self, origin):
        print origin
        return True

    def open(self):
         connections.append(self)
         print("WebSocket")    

    def on_message(self, message):
        print "ok"
        print message
        global nameDash
        a = json.loads(message)#conver json to python
        print a["cmd"]
        if (a["cmd"] == "saveDash"):

            print a["name"] 
            db.InsertDashboard(a["name"],a["data"])
    
        if (a["cmd"] == "chooseDash"):
            nameDash = a["name"]

        if (a["cmd"] == "loadDash"):
            dash= db.FindDashboard(nameDash)
            for da in dash:
                name_dash=da['name']
                if(nameDash==name_dash):
                    #print json.dumps(da['data'])
                    self.write_message(json.dumps(da['data']))            
            
        if (a["cmd"] == "chosenDash"):

            self.write_message(nameDash)
        
        if (a["cmd"] == "deleteDash"):
            db.DeleteDashboard( a["name"])
            os.rmdir(rospkg.RosPack().get_path('rtcrobot_webinterface')+'/www/assets/img/maps/' + ["name"])
            

           
        

        
class manageDashboard(web.RequestHandler):
    def get(self):
        name = []
        dash= db.FindDashboard()
        i=0
        for da in dash:
            name_dash=da['name']
            name.insert(i,name_dash)
            i=i+1
                    
        self.render('../www/dashboard_manager.html', names = name)

#-----------------------------------------------------------------------------------# 

class MapsHandler(web.RequestHandler):
    def get(self):
        map__=[]
       
        map_=db.FindMap()
        i=0
        for ms in map_:

                map__.insert(i,ms)
                i=i+1 
                
               

        self.render('../www/maps.html', maps = map__)

class MappingHandler(web.RequestHandler):
    def get(self):
        # pub_mode = rospy.Publisher('robot_mode', RobotMode, queue_size=10)
        # msg = RobotMode()
        # msg.name = 'mapping'
        # msg.code = 2
        # msg.parameters.append("map_size:="+self.get_argument("mapsize"))
        # pub_mode.publish(msg)
        self.render('../www/mapping.html')
    
    def post(self):
        info = {
           # 'name': self.get_argument('mapname')
            'name':'sora'
        }
        self.render('../www/mapping.html', info = info)


class MapEdit(web.RequestHandler):
    def get(self):
        
        
        # thieu kiem tra ten folder co ton tai hay ko
        #source_dir = rospkg.RosPack().get_path('rtcrobot_navigation') + '/maps/' +self.get_argument('map')
        #dataFile = open(source_dir + '/data.dat', 'r+')
        
        
        #for filename in glob.glob(os.path.join(source_dir, '*.png')):
        #    shutil.copy(filename,rospkg.RosPack().get_path('rtcrobot_webinterface')+ '/www/assets/img/maps/editting/'+ os.path.basename(filename))

        self.render('../www/mapedit.html')
    
    def post(self):
        """Example handle ajax post"""
        dic = escape.json_decode(self.request.body)
        saveEditor(dic)
        # useful code goes here
        self.write(json.dumps({'status': 'ok', 'sent': dic}))
        self.finish()

# def saveEditor(data):
#     path = os.path.join(mapspath_,data['name'])
#     dataFile = open(path + '/data.dat', 'w+')
#     json.dump(data,dataFile)
#     dataFile.close()
    
#     if('navData' in data):
#         imgFile = open(path + '/navigation.png', 'w+')
#         imgFile.write(base64.standard_b64decode(data['navData']))
#         imgFile.close()

#     if('wallData' in data):
#         imgFile = open(path + '/wall.png', 'w+')
#         imgFile.write(base64.standard_b64decode(data['wallData']['imgdata']))
#         imgFile.close()
#     pass

def saveEditor(data):
    print data['name']
    db.DeletePose(map=data['name'])
    db.DeletePoints(name=data['name'])
    for ms in data['zoneData']:

        db.InsertPose(name = ms['settings']['name'],x = ms['settings']['x']*0.05, y = (data['height']-ms['settings']['y'])*0.05, theta =ms['settings']['theta'], map=data['name'], type = ms['settings']['type'])

    if('navData' in data):
     data_= db.ImagetoMap(data=data['navData'])
     data_=np.flipud(data['navData'])
     db.UpdateMap(name=data['name'], newvalues = {'navdata':db.ImagetoMap(data=data_)})
     
   
        #print datacvt
    if('wallData' in data):

       data__=  db.ImagetoMap(data=data['wallData']['imgdata'])
       data__=np.flipud(data__)
       db.UpdateMap(name=data['name'], newvalues = {'walldata': db.ImagetoMap(data= data__)})
       db.InsertPoints(name=data['name'],data= data['wallData']['pointdata'])
       print("save ok")
    
    
       
    

   

        

class ErrorHandler(web.ErrorHandler, BaseHandler):
    """
    Default handler gonna to be used in case of 404 error
    """
    pass

class MissionsHandler(web.RequestHandler):
    def get(self):
         self.render('../www/mission.html')

class setting(web.RequestHandler):
    def get(self):
         self.render('../www/setting.html')

class sound(web.RequestHandler):
    def get(self):
         self.render('../www/sound.html')

class editmissionsHandler(web.RequestHandler):
    def get(self):
        self.render('../www/editmission-1.html')

class UploadHandler(web.RequestHandler):
    def post(self):
        file1 = self.request.files['file1'][0]
        original_fname = file1['filename']
        output_file = open(rospkg.RosPack().get_path('rtcrobot_webinterface')+"/www/sound/" +original_fname, 'w')
        output_file.write(file1['body'])
        self.finish("file" +  original_fname + " is uploaded")


class SocketHandler(websocket.WebSocketHandler):
    def check_origin(self, origin):
        print origin
        return True

    def on_message(self, message):
        data = json.loads(message)
        if(data["name"] == 'COMMAND'):
            for cmd in data["command"]:
                if cmd["command"] == 'CMD_SAVEMAP' :
                    callsavemapsevice(cmd["mapname"])
                    print 'HAHA'
                if cmd["command"] == 'CMD_DELMAP' :
                    deletemap(cmd["mapname"])
                    print 'BABA'
                pass
        #self.write_message(u"You said: " + message)

    def open(self):
        if self not in clientlist_:
            clientlist_.append(self)

    def on_close(self):
        if self in clientlist_:
            clientlist_.remove(self)

class name_mission(websocket.WebSocketHandler): 
    mission_edit=""
    def check_origin(self, origin):
        return True


    def open(self):
         connections.append(self)
         print("WebSocket opened")

    def on_message(self, message):

        #print message



        #print 'message received %s' % message  # recive
        # open file json
        data = json.loads(message)  # convert to string
        length = len(data)
        file_path="json/mission.json"
        path=rospkg.RosPack().get_path('rtcrobot_webinterface')+"/json/mission.json"

        file_mission = open(path, "r")  # open file
        read_file = file_mission.readline()
        convert = json.loads(read_file) # convert string to json 
        list_mission = convert["list"]
        length = len(list_mission)
        path1="/home/mtk/catkin_ws/src/web/json/run_mission.json"
        
        
        

#***************************************************************************
                         # CREAT NEWMISSION 
#***************************************************************************

        if(data["command"] == "creat_mission"):  # tao mission moi
            tem=0
            list_={"name":[]}
            mission=db.FindMission()
            for ms in mission:
                name=ms['name']
              
                if(data['name_mission']==name):
                    print('error')
                    self.write_message("error")
                    tem=1              
            if(tem !=1):
                db.InsertMission(data['name_mission'],data['createby'],'','')
                self.write_message("ok") 

            

               

            


#***************************************************************************
                         # Display mission on page list mission 
#***************************************************************************


        if(data["command"] == "list_mission"):  # display list mission for page mission
            print("list_mission")
            list_={"name":[]}
            mission=db.FindMission()
            for ms in mission:
                name=ms['name']
                list_["name"].insert(0,name)
                

                
            send_web = json.dumps(list_)
            self.write_message(send_web)


#***************************************************************************
                    #edit Mission  
#***************************************************************************

        if(data["command"] == "edit_mission"):  # edit mission
            print("edit_mission")
            global mission_edit
            mission_edit=data['name']
          

            self.write_message("edit")
      

           



         
#***************************************************************************
           
#***************************************************************************

        if(data["command"] == "display_mission"):
            

            # load mission  
            mission=db.FindMission()
            send={
                 'action':[],
                 'map':[],
                 'pose':[],
                 'name_mission':mission_edit
            }
            list_pose_={}
            
            for ms in mission:
                name_mission=ms['name']
                i=0
                if(mission_edit==name_mission):   
                     for x in ms['actions']:
                          send['action'].insert(i,x)
                          i=i+1

            #load map 
            map_=db.FindMap()
           
            j=0
            i=0
            for ms in map_:
                name_map= ms['name']
                send['map'].insert(j,name_map)
                j=j+1
                pose_=[]
                 
                pose=db.FindPose(map=name_map)
                for po in pose:
                    #print po['name']
                    pose_.insert(i,po['name'])
                    i=i+1
                   
            
                send['pose'].insert(j,pose_)
            
            send_web=json.dumps(send)

            self.write_message(send_web)


                
           
                




#***************************************************************************
#***************************************************************************

        if(data["command"] == "save_mission"):
            print("save_mission")      
            edit= {'actions' :[] } 
            i=0
            for ms in data['action']:
        
              edit['actions'].insert(i,ms)   
              i=i+1

           
            db.UpdateMission(name = mission_edit,newvalues= edit )
            
        

        if(data["command"] == "choose_mission"):
            print("choose_mission")      
            global choose_mission
            choose_mission=data['name']
            

          

        if(data["command"] == "load_choose_mission"):
                
              self.write_message(choose_mission)
            
                        

           
#***************************************************************************
                 # xoa mission
#***************************************************************************

        if(data["command"] == "remove_mission"):

            mission=db.FindMission()
            for ms in mission:
                name=ms['name']
                if(data['name']==name):
                    db.DeleteMission(name)
                  
                    

#***************************************************************************
                           # display list parameter
#***************************************************************************

        
        if(data["command"] =="setting"):
               
                file_path=rospkg.RosPack().get_path('rtcrobot_navigation')+"/config/system.yaml"
                with open(file_path) as f:
                    doc = yaml.load(f)
                
                doc.update({'sound':get_sound.Sounds.loadsounds()})
                send_web = json.dumps(doc)

                self.write_message(send_web)

                #self.write_message(json.dumps(get_sound.Sounds.loadsounds()))
                #print get_sound.Sounds.loadsounds()

                
                #t1.start()
                
                

#***************************************************************************
                           # save 
#***************************************************************************
        if(data["command"] =="save_setting"):
                #t1.setDaemon(False)
                #print data
                file_path=rospkg.RosPack().get_path('rtcrobot_navigation')+"/config/system.yaml"
                with open(file_path) as f:  # load file yaml
                    doc = yaml.load(f)
                lon=data['paramerter']
                lon2=lon['DWBLocalPlanner']
                lon3=lon['light']['state']
                
                for x in range(len(data['paramerter']['DWBLocalPlanner'])):
                  data_write_DW=float(list(lon2.values())[x])
                  doc['DWBLocalPlanner'][list(lon2)[x]]=data_write_DW

 
                for x in range(len(data['paramerter']['light']['state'])):
                     data_write_state=str(list(lon3.values())[x])
                     doc['light']['state'][list(lon3)[x]]=data_write_state
                

                with open(file_path, 'w') as f:
                    yaml.dump(doc, f)

                # uuid = roslaunch.rlutil.get_or_generate_uuid(None, False)
                # roslaunch.configure_logging(uuid)
                # launch = roslaunch.parent.ROSLaunchParent(uuid, ["/home/mtk/catkin_ws/src/robot_ws/src/rtcrobot/rtcrobot_navigation/launch/move_base.launch"])
                # launch.shutdown()
                # #rospy.sleep(10)
                # launch.start()
                # rospy.loginfo("started")

                #rospy.sleep(3)

    def on_close(self):
        print("WebSocket closed")
        connections.remove(self)


class AjaxHandler(web.RequestHandler):
    """Simple, ajax handler"""
    def get(self, *args, **kwargs):
        """get unlikely to be used for ajax"""
        self.write("Not allowed")
        self.finish()

    def post(self, *args):
        """Example handle ajax post"""
        mapname = self.get_argument('map')
        Map=db.FindMap(name=mapname)
        Point=db.FindPoints(name=mapname)
        data_navData=[]
        navdata=[]
        walldata =[]
        zoneData=[]
        pointdata=[]
        height=0
        width=0

        if Point.count() > 0:
            
            pt = Point[0]
            pointdata=pt['data']

        pose_ = {"layer": 12, "type": "point", "settings": {"theta": 0}}
        fodder_path = rospkg.RosPack().get_path('rtcrobot_webinterface')+'/www/assets/img/maps/' + mapname
        if(os.path.isdir(fodder_path)):
            print('ok')
        else:
            os.makedirs(fodder_path)
        if Map.count() > 0:
            
            mp = Map[0]
            height=mp['dimension']['height']
            width=mp['dimension']['width']
            image = np.reshape(db.MaptoImage(data=mp['navdata']),(height,width))
            #image = np.reshape(db.MaptoImage(data=mp['navdata']),(1000,1000))
            image=np.flipud(image)
            #image = np.reshape(mp['navdata'],(mp['dimension']['height'],mp['dimension']['width'] ))
            cv2.imwrite(fodder_path+'/navigation.png',image)
            imgFile = open(fodder_path+'/navigation.png', 'r+')
            navdata =  base64.standard_b64encode(imgFile.read())            

            image1 = np.reshape(db.MaptoImage(data=mp['walldata']),(height,width))
            #image = np.reshape(db.MaptoImage(data=mp['navdata']),(1000,1000))
            image1=np.flipud(image1)
            #image = np.reshape(mp['navdata'],(mp['dimension']['height'],mp['dimension']['width'] ))
            cv2.imwrite(fodder_path+'/wall.png',image1)
            imgFile1 = open(fodder_path+'/wall.png', 'r+')
            walldata =  base64.standard_b64encode(imgFile1.read())    
            print walldata



        pose=db.FindPose( map=mapname)
        i=0
        for po in pose: 
            print po['x']
            pose_['settings']['name']=str(po['name'])
            pose_['settings']['x']=po['x']/0.05
            pose_['settings']['y']=po['y']/0.05
            pose_['settings']['theta']=po['theta']
            pose_['settings']['type']=po['type']
            #p = pose_.deepcopy()
            #print pose_
            i=i+1
            print i
            zoneData.append(deepcopy(pose_))
            print zoneData
        

        
        #print zoneData
                    
        data = {
                    'height':height,
                    'width':width,
                    'name':mapname,
                    'navData': navdata,
                    'wallData': {
                            'imgdata':walldata,
                            'pointdata': pointdata,

                        },
                    'zoneData': zoneData
                }

        self.write( json.dumps(data))
        self.finish()
        

        # if(os.path.isdir(path)):

        #     if(os.path.exists(path + '/data.dat')):
        #         dataFile = open(path + '/data.dat', 'r+')
        #         # useful code goes here
        #         self.write(dataFile.read())
        #         self.finish()
        #     else:
        #         imgFile = open(path + '/navigation.png', 'r+')
        #         navdata =  base64.standard_b64encode(imgFile.read())
                
        #         self.write(json.dumps(data))
        # else:
        #     self.write_error(404)
        # #self.finish()

    
def make_app():
    
    rospack = rospkg.RosPack()
    settings = {
    'default_handler_class': ErrorHandler,
    'default_handler_args': dict(status_code=404)
    }
    return web.Application([
        web.url(r"/", MainHandler),
        web.url(r"/ws", SocketHandler),
        web.url(r"/maps.html", MapsHandler),
        web.url(r"/mapping.html", MappingHandler),
        web.url(r"/mapedit.html", MapEdit),
        web.url(r"/(ajax)$", AjaxHandler),
	    web.url(r"/name_mission", name_mission),
	    web.url(r"/editmission",editmissionsHandler),
	    web.url(r"/mission",MissionsHandler),
	    web.url(r"/setting",setting),
        web.url(r"/sound",sound),
        #kien modified
        web.url(r"/dashboard_manager.html", manageDashboard),
        web.url(r"/Dashboard", Dashboard),
        web.url(r"/dashboard_create.html", CreateDashboardHandler),
        #---------------
        web.url(r"/(.*)", web.StaticFileHandler, {'path': rospack.get_path('rtcrobot_webinterface')+'/www/'}),
    ], **settings)

def spin():
    try:
        app = make_app()
        app.listen(8888)
        ioloop.IOLoop.instance().start()
    except Exception as exc:
        pass

def callsavemapsevice(name):
    rospy.wait_for_service('/roboot_services/savemap')
    try:
        sv_savemap = rospy.ServiceProxy('/roboot_services/savemap', SaveMap)
        resp = sv_savemap(name,"Create a map")
        #return resp
    except rospy.ServiceException, e:
        print "Service call failed: %s"%e

def deletemap(name):
    rospack = rospkg.RosPack()
    db.DeleteMap(name = name)
    #os.rmdir(rospkg.RosPack().get_path('rtcrobot_webinterface')+'/www/assets/img/maps/' + ["name"])
    dir = rospkg.RosPack().get_path('rtcrobot_webinterface')+'/www/assets/img/maps/' + name
    shutil.rmtree(dir)
    pass

if __name__ == "__main__":
    #rospy.init_node('webserver', anonymous=True)
    spin()
    