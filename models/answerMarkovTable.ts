/// <reference path="../typings/tsd.d.ts" />

import db = require('./db');

export = AnswerMarkovTable;

class AnswerMarkovTable
{
	public talkId: number;
	public one: string;
	public two: string;
	public three: string;

	public constructor(statusMarkovTable: any)
	{
		this.talkId = statusMarkovTable.talkId;
		this.one = statusMarkovTable.one;
		this.two = statusMarkovTable.two;
		this.three = statusMarkovTable.three;
	}

	public static create(talkId: number, one: string, two: string, three: string, callback: () => void): void {
		db.query('insert into answerMarkovTables (talkId, one, two, three) values (?, ?, ?, ?)',
			[talkId, one, two, three],
			(err: any, info: any) => {
				if (err) console.log(err);
				callback();
			});
	}

	public static search(keyword: string, callback: (markovTables: AnswerMarkovTable[]) => void): void
	{
		db.query("select * from answerMarkovTables where one = ? or two = ? or three = ?",
			[keyword, keyword, keyword],
			(err: any, markovTables: any[]) => callback(markovTables.length != 0 ? markovTables.map((markovTable) => new AnswerMarkovTable(markovTable)) : null));
	}

	public static searchAnswer(talkId: number, callback: (markovTable: AnswerMarkovTable) => void): void
	{
		db.query("select * from answerMarkovTables where talkId = ? and one = '<begin>'",
			[talkId],
			(err: any, markovTables: any[]) => callback(markovTables.length != 0 ? new AnswerMarkovTable(markovTables[0]) : null));
	}

	public static findByOne(one: string, callback: (markovTables: AnswerMarkovTable[]) => void): void {
		db.query("select * from answerMarkovTables where one = ?",
			[one],
			(err: any, markovTables: any[]) => callback(markovTables.length != 0 ? markovTables.map((markovTable) => new AnswerMarkovTable(markovTable)) : null));
	}

	public static getRecentBeginPhrase(callback: (markovTable: AnswerMarkovTable) => void): void {
		db.query("select * from answerMarkovTables where one = '<begin>' order by createdAt desc limit 1",
			[],
			(err: any, markovTables: any[]) => callback(markovTables.length != 0 ? new AnswerMarkovTable(markovTables[0]) : null));
	}

	public static searchEnd(one: string, callback: (markovTables: AnswerMarkovTable[]) => void): void {
		db.query("select * from answerMarkovTables where one = ? and three = '<end>'",
			[one],
			(err: any, markovTables: any[]) => callback(markovTables.length != 0 ? markovTables.map((markovTable) => new AnswerMarkovTable(markovTable)) : null));
	}
}