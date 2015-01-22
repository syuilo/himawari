/// <reference path="../typings/tsd.d.ts" />

import db = require('./db');

export = Answer;

class Answer
{
	public id: number;
	public talkId: string;
	public createdAt: string;
	public text: string;

	public constructor(answer: any)
	{
		this.id = answer.id;
		this.talkId = answer.talkId;
		this.createdAt = answer.createdAt;
		this.text = answer.text;
	}

	public static create(talkId: string, text: string, callback: () => void): void {
		db.query('insert into answers (talkId, text) values (?, ?)',
			[talkId, text],
			(err: any, info: any) => {
				if (err) console.log(err);
				callback();
			});
	}

	public static find(talkId: string, callback: (answer: Answer) => void): void {
		db.query("select * from answers where talkId = ?",
			[talkId],
			(err: any, answers: any[]) => callback(answers.length != 0 ? new Answer(answers[0]) : null));
	}
}