/// <reference path="./typings/tsd.d.ts" />

var Twitter = require('twitter');
import async = require('async');

import Himawari = require('./himawari');

var nullFunction = (): void => { };
var trim = (text: string) =>
{
	return text.replace(/^[\s　]+|[\s　]+$/g, '');
}

export = Twbot;

/**
  himawariのTwitterBot実装です
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

	/**
	  学習するソースのフィルタ (true = 学習しない, false = 学習する)
	  @propety {(status: string): boolean} studyFilter
	  */
	public studyFilter = (status: string): boolean =>
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
		if (status.indexOf('RT') >= 0) return true;
		return false;
	};

	/**
	  会話の学習のフィルタ (true = 学習しない, false = 学習する)
	  @propety {(status: string): boolean} studyFilter
	  */
	public studyTalkFilter = (status: string): boolean =>
	{
		if (status.indexOf('http') >= 0) return true;
		if (status.indexOf('RT') >= 0) return true;
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
	  Twitterにツイートを投稿します
	  @method tweet
	  @param {string} text - ツイート内容
	  @param {string} [inReplyToStatusId] - 返信先ツイートID
	  @return {void} 値を返しません
	  */
	public tweet(text: string, inReplyToStatusId: string = null): void
	{
		text = trim(text);
		if (text == '')
		{
			return;
		}
		else
		{
			this.twitter.post('statuses/update', { status: text, in_reply_to_status_id: inReplyToStatusId }, nullFunction);
		}
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
				var length = 1 + Math.floor(Math.random() * 2);
				this.himawari.comment(result[0][0], (comment: string) =>
				{
					this.tweet(comment);
				}, length);
			});
		});
	}

	public command(text: string): string
	{
		switch (text.replace(/\s+/g, '').replace('>', ''))
		{
			case 'ping':
				return 'pong';
				break;
			case 'whoareyou?':
				return this.name;
				break;
			case 'saysn':
				return this.screenName;
				break;
			case 'areyoustudent?':
				return this.isStudent.toString();
				break;
		}
		return null;
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
			if (text == '' || text == null) return;
			var statusText = '@' + post.user.screen_name + ' ' + text;
			this.tweet(statusText, post.id_str);
		};

		// Command
		if (message[0] == '>')
		{
			sentReply(this.command(message));
		}

		// 返信
		this.himawari.reply(message, (himawariAnswer: string) =>
		{
			setTimeout(() =>
			{
				sentReply(himawariAnswer);
			}, Math.floor(Math.random() * 10000));
		});
	}

	/**
	  ダイレクトメッセージに返信します
	  @method replyDm
	  @param {any} dm - 返信先のダイレクトメッセージにオブジェクト
	  @return {void} 値を返しません
	  */
	public replyDm(dm: any): void
	{
		var message = dm.text;

		if (message == null) return;

		var sentReply = (text: string) =>
		{
			if (text == '' || text == null) return;
			this.twitter.post('direct_messages/new', { text: text, user_id: dm.sender.id_str }, nullFunction);
		};

		// Command
		if (message[0] == '>')
		{
			sentReply(this.command(message));
		}

		// 返信
		this.himawari.reply(message, (himawariAnswer: string) =>
		{
			setTimeout(() =>
			{
				sentReply(himawariAnswer);
			}, Math.floor(Math.random() * 10000));
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

		Himawari.morphologicalAnalyze(text, (result: string[][]) =>
		{
			var keyword: string[] = null;
			async.each(result, (i: string[], callback: () => void) =>
			{
				if (keyword == null && (i[2] == '固有名詞' || (i[1] == '名詞' && i[2] == '一般')))
				{
					keyword = i;
				}
				callback();
			}, (err: any) =>
				{
					if (err) throw err;

					if (keyword != null && keyword[8] != null && keyword[8] != '*' && keyword[8] != keyword[0])
					{
						var status = this.oboemashitashiFormat.replace('{text}', keyword[0]).replace('{yomi}', keyword[8]);
						this.tweet(status);
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

				// ダイレクトメッセージ
				if (data.direct_message != null)
				{
					// 自分のDMは弾く
					if (data.direct_message.sender.screen_name == this.screenName) return;

					// 返信
					this.replyDm(data.direct_message);
				}
				// ツイート
				else if (data.text != null)
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
									// 自分が関わっている場合は弾く
									if (obj.user.screen_name == this.screenName) return;
									if (data.user.screen_name == this.screenName) return;

									var q = trim(obj.text.replace(/@[a-zA-Z0-9_]+/g, ''));
									var a = trim(status.replace(/@[a-zA-Z0-9_]+/g, ''));

									if (this.studyTalkFilter(q)) return;
									if (this.studyTalkFilter(a)) return;

									// 会話を保存
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
							if (this.studyFilter(status)) return;

							status = this.trimStatus(status);

							if (this.isStudent) this.himawari.study(status);
						}
					}
				}
			});
		});
	}
}
