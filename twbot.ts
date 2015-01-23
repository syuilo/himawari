/// <reference path="./typings/tsd.d.ts" />

var Twitter = require('twitter');
import async = require('async');

import Himawari = require('./himawari');

var nullFunction = (): void => { };

export = Twbot;

/**
	HimawariのTwitterBot実装です
	@class Twbot
	*/
class Twbot
{
	public himawari: Himawari;

	public twitter: any;
	public recentTweet: any = null;

	/**
		botの名前
		@propety {string} name
		*/
	public name: string;

	/**
		botのユーザー名(Screen name)
		@propety {string} screenName
		*/
	public screenName: string;

	/**
		覚えましたしツイート時のツイートフォーマット
		@propety {string} oboemashitashiFormat
		*/
	public oboemashitashiFormat: string = '({text}......{yomi}......覚えましたし)';

	/**
		ツイートを学習するかどうか
		@propety {boolean} isStudent
		*/
	public isStudent: boolean = true;

	/**
		エゴふぁぼ&RTするか
		@propety {boolean} canEgoFavRt
		*/
	public canEgoFavRt: boolean = true;

	public statusFilter = (status: string): boolean =>
	{
		if (status.indexOf('http') >= 0) return true;
		if (status.indexOf(':') >= 0) return true;
		if (status.indexOf('：') >= 0) return true;
		if (status.indexOf('"') >= 0) return true;
		if (status.indexOf('「') >= 0) return true;
		if (status.indexOf('」') >= 0) return true;
		if (status.indexOf('(') >= 0) return true;
		if (status.indexOf(')') >= 0) return true;
		if (status.indexOf('（') >= 0) return true;
		if (status.indexOf('）') >= 0) return true;
		if (status.indexOf('[') >= 0) return true;
		if (status.indexOf(']') >= 0) return true;
		if (status.indexOf('<') >= 0) return true;
		if (status.indexOf('>') >= 0) return true;
		if (status.indexOf('&gt;') >= 0) return true;
		if (status.indexOf('&lt;') >= 0) return true;
		if (status.indexOf('【') >= 0) return true;
		if (status.indexOf('】') >= 0) return true;
		if (status.indexOf('\n') >= 0) return true;
		return false;
	};

	public trimStatus = (status: string): string =>
	{
		if (status.indexOf('。') >= 0)
		{
			status = status.substr(0, status.indexOf('。'));
		}
		if (status.indexOf('？') >= 0)
		{
			status = status.substr(0, status.indexOf('？') + 1);
		}
		if (status.indexOf('?') >= 0)
		{
			status = status.substr(0, status.indexOf('?') + 1);
		}
		if (status.indexOf('！') >= 0)
		{
			status = status.substr(0, status.indexOf('！'));
		}
		if (status.indexOf('!') >= 0)
		{
			status = status.substr(0, status.indexOf('!'));
		}
		if (status.indexOf('#') >= 0)
		{
			status = status.substr(0, status.indexOf('#'));
		}
		status = status.replace(/ +$/, '')
			.replace(/・+$/, '')
			.replace(/\.+$/, '')
			.replace(/ー+$/, '')
			.replace(/～+$/, '');

		return status;
	};

	/**
		@class Himawari.Twbot
		@constructor
		@param {string} name - botの名前
		@param {string} screenName - botのユーザー名(Screen name)
		@param {string} ck - コンシューマーキー
		@param {string} cs - コンシューマーシークレット
		@param {string} at - アクセストークン
		@param {string} ats - アクセストークンシークレット
		@param {(text: string) => string} [textFilter] - 発言のフィルター
		*/
	constructor(name: string, screenName: string, ck: string, cs: string, at: string, ats: string, textFilter: (text: string) => string = (text: string): string => { return text })
	{
		this.himawari = new Himawari();
		this.himawari.textFilter = textFilter;

		this.name = name;
		this.screenName = screenName;

		this.twitter = new Twitter({
			consumer_key: ck,
			consumer_secret: cs,
			access_token_key: at,
			access_token_secret: ats
		});
	}

	/**
		適当につぶやきます
		@method comment
		@return {void} 値を返しません
		*/
	public comment(): void
	{
		// トレンドを取得
		this.twitter.get('trends/place', { id: 23424856, exclude: true }, (trendsError: any, trendsParams: any, trendsResponse: any) =>
		{
			if (trendsError) console.log(trendsError);

			// そのなかからランダムに選択
			var r = Math.floor(Math.random() * trendsParams[0].trends.length);
			var trend = trendsParams[0].trends[r].name;

			Himawari.morphologicalAnalyze(trend, (result: string[][]) =>
			{
				this.himawari.comment(result[0][0], (comment: string) =>
				{
					this.twitter.post('statuses/update', { status: comment }, nullFunction);
				});
			});
		});
	}

	/**
		返信します
		@method reply
		@param {any} post - 返信先の投稿オブジェクト
		@return {void} 値を返しません
		*/
	public reply(post: any): void
	{
		// @sn を取り除く
		var message = post.text.replace(/@[a-zA-Z0-9_]+\s?/, '');

		if (message == null) return;

		var sentReply = (text: string) =>
		{
			var statusText = '@' + post.user.screen_name + ' ' + text;
			this.twitter.post('statuses/update', { status: statusText, in_reply_to_status_id: post.id_str }, nullFunction);
		};

		// コマンド
		if (message[0] == '>')
		{
			switch (message.replace(/\s+/g, '').replace('>', ''))
			{
				case 'ping':
					sentReply('pong');
					break;
				case 'whoareyou?':
					sentReply(this.name);
					break;
				case 'saysn':
					sentReply(this.screenName);
					break;
				case 'areyoustudent?':
					sentReply(this.isStudent.toString());
					break;
			}
			return;
		}

		// 返信
		this.himawari.reply(message, (himawariAnswer: string) =>
		{
			setTimeout(() =>
			{
				sentReply(himawariAnswer);
			}, 5000);
		});
	}

	/**
		覚えましたし
		@method oboemashitashi
		@return {void} 値を返しません
		*/
	public oboemashitashi(): void
	{
		if (this.recentTweet == null) return;

		var text = this.recentTweet.text;

		console.log('## input');
		Himawari.morphologicalAnalyze(text, (result: string[][]) =>
		{
			var keyword: string[] = null;
			async.each(result, (i: string[], callback: () => void) =>
			{
				if (keyword == null && (i[2] == '固有名詞' || (i[1] == '名詞' && i[2] == '一般')))
				{
					keyword = i;
					console.log('## input - ' + keyword[0]);
				}
				callback();
			}, (err: any) =>
				{
					if (err) throw err;

					console.log('## input --- ' + keyword);

					if (keyword != null && keyword[7] != '*' && keyword[7] != keyword[0])
					{
						var status = this.oboemashitashiFormat.replace('{text}', keyword[0]).replace('{yomi}', keyword[7]);
						this.twitter.post('statuses/update', { status: status }, nullFunction);
					}
				});
		});
	}

	/**
		Streamの待受を開始します
		@method begin
		@return {void} 値を返しません
		*/
	public begin(): void
	{
		this.twitter.stream('user', { replies: 'all' }, (stream: any) =>
		{
			stream.on('data', (data: any) =>
			{
				//console.log(data);
				if (data.text != null)
				{
					data.text = data.text.replace(/&gt;/g, '>');
					data.text = data.text.replace(/&lt;/g, '<');
					var status: string = data.text;

					// 会話(リプライ)なら(ただし自分と自分宛てのリプライは除く)
					if (data.in_reply_to_status_id_str != null && data.user.screen_name != this.screenName && !status.match(new RegExp('^@' + this.screenName)))
					{
						// 学習するように設定されている場合は会話を学習する
						if (this.isStudent)
						{
							// 会話を学習するためにリプライ先のツイートを取得する
							this.twitter.get('statuses/show', { id: data.in_reply_to_status_id_str }, (err: any, obj: any, res: any) =>
							{
								if (err == null)
								{
									// 会話を保存
									var q = obj.text.replace(/@[a-zA-Z0-9_]+/g, '');
									var a = status.replace(/@[a-zA-Z0-9_]+/g, '');
									this.himawari.studyTalk(q, a);
								}
							});
						}
					}
					// 通常のツイートなら
					else
					{
						// 自分自信のツイートは弾く
						if (data.user.screen_name != this.screenName)
						{
							this.recentTweet = data;

							// 自分に対するリプライなら
							if (status.match(new RegExp('^@' + this.screenName)))
							{
								// ふぁぼっとく
								this.twitter.post('favorites/create', { id: data.id_str }, nullFunction);

								// フォローしてなかったらフォローしとく
								if (data.user.following == null)
								{
									this.twitter.post('friendships/create', { user_id: data.user.id_str, follow: false }, nullFunction);
								}

								// 返信する
								this.reply(data);
								return;
							}

							// エゴふぁぼRT
							if (status.indexOf(this.name) >= 0 && this.canEgoFavRt)
							{
								this.twitter.post('favorites/create', { id: data.id_str }, nullFunction);
								this.twitter.post('statuses/retweet', { id: data.id_str }, nullFunction);
							}

							if (status.indexOf('@') >= 0) return;
							if (this.statusFilter(status)) return;

							status = this.trimStatus(status);

							if (this.isStudent) this.himawari.study(status);
						}
					}
				}
			});
		});
	}
}