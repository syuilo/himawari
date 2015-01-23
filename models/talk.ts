/// <reference path="../typings/tsd.d.ts" />

import db = require('./db');

export = Talk;

class Talk
{
	public id: number;
	public createdAt: string;
	public question: string;
	public answer: string;

	public constructor(talk: any)
	{
		this.id = talk.id;
		this.createdAt = talk.createdAt;
		this.question = talk.question;
		this.answer = talk.answer;
	}

	public static create(q: string, a: string, callback: (insertId: number) => void): void
	{
		db.query('insert into talks (question, answer) values (?, ?)',
			[q, a],
			(err: any, info: any) =>
			{
				if (err)
				{
					console.log(err);
				}
				else
				{
					callback(info.insertId);
				}
			});
	}

	public static find(id: number, callback: (talk: Talk) => void): void
	{
		db.query("select * from talks where id = ?",
			[id],
			(err: any, talks: any[]) => callback(talks.length != 0 ? new Talk(talks[0]) : null));
	}
}