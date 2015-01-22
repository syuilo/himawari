/// <reference path="../typings/tsd.d.ts" />

import db = require('./db');

export = Question;

class Question
{
	public id: number;
	public talkId: string;
	public createdAt: string;
	public text: string;

	public constructor(question: any)
	{
		this.id = question.id;
		this.talkId = question.talkId;
		this.createdAt = question.createdAt;
		this.text = question.text;
	}

	public static create(talkId: string, text: string, callback: () => void): void {
		db.query('insert into questions (talkId, text) values (?, ?)',
			[talkId, text],
			(err: any, info: any) => {
				if (err) console.log(err);
				callback();
			});
	}

	public static find(talkId: string, callback: (question: Question) => void): void {
		db.query("select * from questions where talkId = ?",
			[talkId],
			(err: any, questions: any[]) => callback(questions.length != 0 ? new Question(questions[0]) : null));
	}
}