/// <reference path="../typings/tsd.d.ts" />

import db = require('./db');

export = ReplyMarkovTable;

class ReplyMarkovTable {
	public one: string;
	public two: string;
	public three: string;

	public constructor(replyMarkovTable: any) {
		this.one = replyMarkovTable.one;
		this.two = replyMarkovTable.two;
		this.three = replyMarkovTable.three;
	}

	public static create(one: string, two: string, three: string, callback: () => void): void {
		db.query('insert into replyMarkovTables (one, two, three) values (?, ?, ?)',
			[one, two, three],
			(err: any, info: any) => {
				if (err) console.log(err);
				callback();
			});
	}

	public static findByOne(one: string, callback: (replyMarkovTables: ReplyMarkovTable[]) => void): void {
		db.query("select * from replyMarkovTables where one = ?",
			[one],
			(err: any, replyMarkovTables: any[]) => callback(replyMarkovTables.length != 0 ? replyMarkovTables.map((replyMarkovTable) => new ReplyMarkovTable(replyMarkovTable)) : null));
	}

	public static getRecentBeginPhrase(callback: (replyMarkovTable: ReplyMarkovTable) => void): void {
		db.query("select * from replyMarkovTables where one = '<begin>' order by createdAt desc limit 1",
			[],
			(err: any, replyMarkovTables: any[]) => callback(replyMarkovTables.length != 0 ? new ReplyMarkovTable(replyMarkovTables[0]) : null));
	}

	public static searchEnd(one: string, callback: (replyMarkovTables: ReplyMarkovTable[]) => void): void {
		db.query("select * from replyMarkovTables where one = ? and three = '<end>'",
			[one],
			(err: any, replyMarkovTables: any[]) => callback(replyMarkovTables.length != 0 ? replyMarkovTables.map((replyMarkovTable) => new ReplyMarkovTable(replyMarkovTable)) : null));
	}
}