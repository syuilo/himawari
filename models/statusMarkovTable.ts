/// <reference path="../typings/tsd.d.ts" />

import db = require('./db');

export = StatusMarkovTable;

class StatusMarkovTable {
	public one: string;
	public two: string;
	public three: string;

	public constructor(statusMarkovTable: any) {
		this.one = statusMarkovTable.one;
		this.two = statusMarkovTable.two;
		this.three = statusMarkovTable.three;
	}

	public static create(one: string, two: string, three: string, callback: () => void): void {
		db.query('insert into statusMarkovTables (one, two, three) values (?, ?, ?)',
			[one, two, three],
			(err: any, info: any) => {
				if (err) console.log(err);
				callback();
			});
	}

	public static findByOne(one: string, callback: (statusMarkovTables: StatusMarkovTable[]) => void): void {
		db.query("select * from statusMarkovTables where one = ?",
			[one],
			(err: any, statusMarkovTables: any[]) => callback(statusMarkovTables.length != 0 ? statusMarkovTables.map((statusMarkovTable) => new StatusMarkovTable(statusMarkovTable)) : null));
	}

	public static getRecentBeginPhrase(callback: (statusMarkovTable: StatusMarkovTable) => void): void {
		db.query("select * from statusMarkovTables where one = '<begin>' order by createdAt desc limit 1",
			[],
			(err: any, statusMarkovTables: any[]) => callback(statusMarkovTables.length != 0 ? new StatusMarkovTable(statusMarkovTables[0]) : null));
	}

	public static searchEnd(one: string, callback: (statusMarkovTables: StatusMarkovTable[]) => void): void {
		db.query("select * from statusMarkovTables where one = ? and three = '<end>'",
			[one],
			(err: any, statusMarkovTables: any[]) => callback(statusMarkovTables.length != 0 ? statusMarkovTables.map((statusMarkovTable) => new StatusMarkovTable(statusMarkovTable)) : null));
	}
}