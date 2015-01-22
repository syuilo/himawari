/// <reference path="../typings/tsd.d.ts" />

import mysql = require('mysql');
var config: any = require('../config/config.json');
var dbh = mysql.createPool(config.db);
export = dbh;