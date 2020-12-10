import math
import rospy
import rospkg
import actionlib
import std_srvs.srv
import time
from math import sin, cos
import numpy as np

from move_base_msgs.msg import MoveBaseAction, MoveBaseGoal
from geometry_msgs.msg import Pose, Quaternion
from tf.transformations import quaternion_from_euler
from rtcrobot_actions.msg import UnDockAction, UnDockGoal, DockAction, DockGoal
from actionlib_msgs.msg import GoalStatus

import pymongo


#region DataBase
#
#
#
class DataBase():
    UNDOCK  = 0
    MOVE    = 1
    Server    = "mongodb://192.168.5.10:27017/"

    def __init__(self):
        rospy.loginfo("Connect to database server")
        self.myclient = pymongo.MongoClient(DataBase.Server)
        print self.myclient.list_database_names()
        self.database = self.myclient["dbFleet"]
        pass
# POSE
    @staticmethod
    def InsertPose(name = '',x = 0.0, y = 0.0, theta = 0.0, map='defaut', type = 0):
        #Check info
        myquery = {}
        if name == '':
            return False
        
        myquery['name']     = name
        myquery['x']        = x
        myquery['y']        = y
        myquery['theta']    = theta
        myquery['map']      = map
        myquery['type']     = type

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["poses"]
        return collection.insert_one(myquery)
        pass

    @staticmethod
    def FindPose(name = '', map='', type =''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 
        if map != '':
            myquery['map'] = map 
        if type != '':
            myquery['type'] = type 

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["poses"]
        return collection.find(myquery)
        pass

    @staticmethod
    def UpdatePose(name = '', map='', newvalues = None):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 
        if map != '':
            myquery['map'] = map 
        if newvalues != None:
            myclient = pymongo.MongoClient(DataBase.Server)
            database = myclient["dbFleet"]
            collection = database["poses"]
            nvalues = { "$set": newvalues }
            x = collection.update_many(myquery, nvalues)
            return x.modified_count
        # get documents
        return 0
        pass

    @staticmethod
    def DeletePose(name = '', map='', newvalues = None):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 
        if map != '':
            myquery['map'] = map 
        
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["poses"]
        collection.delete_many(myquery)
        pass

# MAP
    @staticmethod
    def InsertMap(name = '',createby = '', date = '' , origin = None, dimension = None, navdata=None, walldata=None):
        #Check info
        myquery = {}
        if name == '' or dimension == None:
            return False
        
        if origin == None:
            origin = {'x': 0.0, 'y':0.0, 'theta': 0.0}

        
        myquery['name']         = name
        myquery['createby']     = createby
        myquery['date']         = date
        myquery['origin']       = origin
        myquery['dimension']    = dimension
        myquery['navdata']      = navdata
        myquery['walldata']     = walldata

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["maps"]
        collection.insert_one(myquery)
        return True
        pass

    @staticmethod
    def FindMap(name = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name  

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["maps"]
        return collection.find(myquery)
        pass

    @staticmethod
    def FindActiveMap():
        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["maps"]
        return collection.find({'active': True})
        pass

    @staticmethod
    def UpdateMap(name = '', newvalues = None):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 
        if newvalues != None:
            myclient = pymongo.MongoClient(DataBase.Server)
            database = myclient["dbFleet"]
            collection = database["maps"]
            nvalues = { "$set": newvalues }
            x = collection.update_many(myquery, nvalues)
            return x.modified_count
        # get documents
        return 0
        pass

    @staticmethod
    def DeleteMap(name = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 

        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["maps"]
        collection.delete_many(myquery)
        pass

    @staticmethod
    def ActiveMap(name=''):
        if name == '':
            return False
        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["maps"]

        collection.update_many( {"active": True}, { "$set": { "active": False} })
        collection.update_one( {"name": name}, { "$set": { "active": True} })
        #return collection.find({'active': True})
        pass

    @staticmethod
    def MaptoImage(data=[]):
        dat=[]
        for item in data:
            if item == -1:
                item = 205
            elif item > 65:
                item = 0
            else:
                item = 254
            dat.append(item)
        return dat
        pass

    @staticmethod
    def ImagetoMap(data=[]):
        dat=[]
        for item in data:
            if item == 205:
                dat.append(-1)
            elif item > 200:
                dat.append(0)
            else:
                dat.append(100)
        return dat
        pass

# ZONE
    @staticmethod
    def InsertZone(name = '',points = None, type = 0 , map = ''):
        #Check info
        myquery = {}
        if name == '' or map == '' or points == None:
            return False
        
        myquery['name']   = name
        myquery['points'] = points
        myquery['map']    = map
        myquery['type']   = type

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["zones"]
        collection.insert_one(myquery)
        return True
        pass

    @staticmethod
    def FindZone(name = '', type = '', map = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name
        if map != '':
            myquery['map'] = map 
        if type != '':
            myquery['type'] = type 

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["zones"]
        return collection.find(myquery)
        pass

    @staticmethod
    def UpdateZone(name = '', map = '', newvalues = None):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 
        if map != '':
            obj['map'] = map 

        if newvalues != None:
            myclient = pymongo.MongoClient(DataBase.Server)
            database = myclient["dbFleet"]
            collection = database["zones"]
            nvalues = { "$set": newvalues }
            x = collection.update_many(myquery, nvalues)
            return x.modified_count
        # get documents
        return 0
        pass

    @staticmethod
    def DeleteZone(name = '', map = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 
        if map != '':
            obj['map'] = map 

        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["zones"]
        collection.delete_many(myquery)
        pass

# MISSION
    @staticmethod
    def InsertMission(name = '',createby = '', date = '' , actions = None):
        #Check info
        myquery = {}
        if name == '' or actions == None:
            return False
        
        myquery['name']   = name
        myquery['createby'] = createby
        myquery['date']    = date
        myquery['actions']   = actions

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["missions"]
        collection.insert_one(myquery)
        return True
        pass
        

    @staticmethod
    def FindMission(name = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name  

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["missions"]
        return collection.find(myquery)
        pass

    @staticmethod
    def UpdateMission(name = '', newvalues = None):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 

        if newvalues != None:
            myclient = pymongo.MongoClient(DataBase.Server)
            database = myclient["dbFleet"]
            collection = database["missions"]
            nvalues = { "$set": newvalues }
            x = collection.update_many(myquery, nvalues)
            return x.modified_count
        # get documents
        return 0
        pass

    @staticmethod
    def DeleteMission(name = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 

        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["missions"]
        collection.delete_many(myquery)
        pass

# CLONE DATABASE
    @staticmethod
    def CloneDatabase():
        client = pymongo.MongoClient('mongodb://localhost:27017/')

        mydb = client["dbFleet"]
        print mydb.some_collection

        #client.admin.command('copydb',
        #                 fromdb='dbFleet',
        #                 todb='dbFleet',
        #                 fromhost='192.168.5.52',
        #                 bypassDocumentValidation = True)


#DASHBOARD 
    @staticmethod
    def InsertDashboard(name = '', data = None):
        #Check info
        myquery = {}
        if name == '' or data == None:
            return False
        
        myquery['name']   = name
        myquery['data']    = data 
    
        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["dashboards"]
        collection.insert_one(myquery)
        return True
        pass
    
    @staticmethod
    def FindDashboard(name = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name  

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["dashboards"]
        return collection.find(myquery)
        pass
    

    @staticmethod
    def DeleteDashboard(name = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 

        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["dashboards"]
        collection.delete_many(myquery)
        pass
#DASHBOARD 
    @staticmethod
    def InsertPoints(name = '', data = None):
        #Check info
        myquery = {}
        if name == '' or data == None:
            return False
        
        myquery['name']   = name
        myquery['data']    = data 
    
        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["points"]
        collection.insert_one(myquery)
        return True
        pass
    
    @staticmethod
    def FindPoints(name = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name  

        # get documents
        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["points"]
        return collection.find(myquery)
        pass
    

    @staticmethod
    def DeletePoints(name = ''):
        #Check info
        myquery = {}
        if name != '':
            myquery['name'] = name 

        myclient = pymongo.MongoClient(DataBase.Server)
        database = myclient["dbFleet"]
        collection = database["points"]
        collection.delete_many(myquery)
        pass
# SPIN
    def spin(self):
        r = rospy.Rate(20)
        while not rospy.is_shutdown():
            r.sleep()

        
#endregion
