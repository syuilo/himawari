/// <reference path="../typings/tsd.d.ts" />

import db = require('./db');

export = TwitterUser;

class TwitterUser
{
	public botName: string;
	public twitterId: number;
	public name: string;
	public likability: number;
	public createdAt: string;

	public constructor(twitterUser: any)
	{
		this.botName = twitterUser.botName;
		this.twitterId = twitterUser.twitterId;
		this.name = twitterUser.name;
		this.likability = twitterUser.likability;
		this.createdAt = twitterUser.createdAt;
	}

	public static create(botName: string, twitterId: number, name: string, callback: () => void): void {
		db.query('insert into twitterUsers (botName, twitterId, name) values (?, ?, ?)',
			[botName, twitterId, name],
			(err: any, info: any) => {
				if (err)
					console.log(err);
				else
					callback();
			});
	}

	public static find(botName: string, twitterId: number, callback: (twitterUser: TwitterUser) => void): void {
		db.query("select * from twitterUsers where botName = ? and twitterId = ?",
			[botName, twitterId],
			(err: any, twitterUsers: any[]) => callback(twitterUsers.length != 0 ? new TwitterUser(twitterUsers[0]) : null));
	}

	public update(callback: () => void = () => { }): void
	{
		db.query('update twitterUsers set name=?, likability=? where twitterId=?',
			[this.name, this.likability, this.twitterId],
			(err: any, info: any) =>
			{
				if (err)
					console.log(err);
				else
					callback();
			});
	}
}