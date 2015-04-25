/// <reference path="./typings/tsd.d.ts" />

/*
 * himawari - 向日葵 for TwitterBot | マルコフ連鎖ベースのお手軽bot
 * Copyright (c) syuilo 'himawari', 'himawari for twitterBot' rights reserved
 */

var Twitter = require('twitter');
import async = require('async');
import express = require('express');
import SocketIO = require('socket.io');

import Himawari = require('./himawari');
import TwitterUser = require('./models/twitterUser');

var nullFunction = (): void => { };
var trim = (text: string) => {
	return text.replace(/^[\s　]+|[\s　]+$/g, '');
}

export = Twbot;

/**
  himawariのTwitterBot実装です
  @class Twbot
  */
class Twbot {
	public himawari: Himawari;

	public twitter: any;
	public recentTweet: any = null;

	/**
	  botのTwitterアカウンヨデータ
	  @propety {any} account
	  */
	public account: any;

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
	  ツイート・会話を学習するかどうか
	  @propety {boolean} isStudent
	  */
	public isStudent: boolean = true;

	/**
	  リプライをふぁぼるか
	  @propety {boolean} favReply
	  */
	public favReply: boolean = true;

	/**
	  リプライを受け取った時に自動でフォローするか
	  @propety {boolean} followWhenReceiveReply
	  */
	public followWhenReceiveReply: boolean = true;

	/**
	  エゴふぁぼ&RTするか
	  @propety {boolean} canEgoFavRt
	  */
	public canEgoFavRt: boolean = true;

	/**
	  Bot監視用Webページを利用するか
	  @propety {boolean} canServeWeb
	  */
	public canServeWeb: boolean = true;

	/**
	  Bot監視用Webページの待ち受けポート
	  @propety {number} webPort
	  */
	public webPort: number = 80;

	private webServer: express.Express;

	private webStreamingSockets: SocketIO.Socket[] = [];

	/**
	  学習するソースのフィルタ (true = 学習しない, false = 学習する)
	  @propety {(status: string): boolean} studyFilter
	  */
	public studyFilter = (status: string): boolean => {
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
	public studyTalkFilter = (status: string): boolean => {
		if (status.indexOf('http') >= 0) return true;
		if (status.indexOf(':') >= 0) return true;
		if (status.indexOf('：') >= 0) return true;
		if (status.indexOf('<') >= 0) return true;
		if (status.indexOf('>') >= 0) return true;
		if (status.indexOf('&gt;') >= 0) return true;
		if (status.indexOf('&lt;') >= 0) return true;
		if (status.indexOf('\n') >= 0) return true;
		if (status.indexOf('RT') >= 0) return true;
		return false;
	};

	public trimStatus = (status: string): string => {
		if (status.indexOf('。') >= 0) {
			status = status.substr(0, status.indexOf('。'));
		}
		if (status.indexOf('？') >= 0) {
			status = status.substr(0, status.indexOf('？') + 1);
		}
		if (status.indexOf('?') >= 0) {
			status = status.substr(0, status.indexOf('?') + 1);
		}
		if (status.indexOf('！') >= 0) {
			status = status.substr(0, status.indexOf('！'));
		}
		if (status.indexOf('!') >= 0) {
			status = status.substr(0, status.indexOf('!'));
		}
		if (status.indexOf('#') >= 0) {
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
	constructor(
		name: string,
		screenName: string,
		ck: string,
		cs: string,
		at: string,
		ats: string,
		textFilter: (text: string) => string = (text: string): string => { return text },
		canWebserver: boolean = true,
		webPort: number = null) {
		var bot = this;

		// Init Twitter context
		bot.twitter = new Twitter({
			consumer_key: ck,
			consumer_secret: cs,
			access_token_key: at,
			access_token_secret: ats
		});

		// Twitterアカウンヨ情報を取得
		bot.twitter.get('users/show', { screen_name: screenName },(showError: any, showParams: any, showResponse: any) => {
			if (showError) console.log(showError);
			console.log(showParams);
			bot.account = showParams;

			// Init himawari
			bot.himawari = new Himawari();
			bot.himawari.textFilter = textFilter;

			bot.name = name;
			bot.screenName = screenName;
			bot.canServeWeb = canWebserver;
			bot.webPort = webPort;

			// Webserver setteing
			if (canWebserver) {
				bot.webServer = express();

				bot.webServer.set('view engine', 'jade');
				bot.webServer.set('views', __dirname + '/web/views');
				bot.webServer.use(express.static(__dirname + '/web/statics'));

				// Home routing
				bot.webServer.get('/', function (req: express.Request, res: express.Response) {
					console.log('kyoppie');
					res.render('home', {
						bot: bot
					});
				});

				// SocketIO settings
				var io = SocketIO(bot.webServer.createServer());
				io.of('/home').on('connection', function (socket: SocketIO.Socket) {
					bot.webStreamingSockets.push(socket);
				});

				// Start listen
				bot.webServer.listen(webPort);
			}
		});
	}

	/**
	  Twitterにツイートを投稿します
	  @method tweet
	  @param {string} text - ツイート内容
	  @param {string} [inReplyToStatusId] - 返信先ツイートID
	  @return {void} 値を返しません
	  */
	public tweet(text: string, inReplyToStatusId: string = null): void {
		text = trim(text);
		if (text == '') {
			return;
		}
		else {
			this.twitter.post('statuses/update', { status: text, in_reply_to_status_id: inReplyToStatusId }, nullFunction);
		}
	}

	/**
	  ダイレクトメッセージを送信します
	  @method tweet
	  @param {string} text - メッセージ
	  @param {string} userId - 送信先ユーザーのID
	  @return {void} 値を返しません
	  */
	public createDirectMessage(text: string, userId: string): void {
		text = trim(text);
		if (text == '') {
			return;
		}
		else {
			this.twitter.post('direct_messages/new', { text: text, user_id: userId }, nullFunction);
		}
	}

	/**
	  適当につぶやきます
	  @method comment
	  @return {void} 値を返しません
	  */
	public comment(): void {
		// トレンドを取得
		this.twitter.get('trends/place', { id: 23424856, exclude: true },(trendsError: any, trendsParams: any, trendsResponse: any) => {
			if (trendsError) console.log(trendsError);

			// その中からランダムに選択
			var r = Math.floor(Math.random() * trendsParams[0].trends.length);
			var trend = trendsParams[0].trends[r].name;

			Himawari.morphologicalAnalyze(trend,(result: string[][]) => {
				var length = 1 + Math.floor(Math.random() * 2);
				this.himawari.comment(result[0][0],(comment: string) => {
					this.tweet(comment);
				}, length);
			});
		});
	}

	public command(text: string): string {
		switch (text.replace(/\s+/g, '').replace('>', '')) {
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
	public reply(post: any): void {
		// @sn を取り除く
		var message = post.text.replace(/@[a-zA-Z0-9_]+\s?/, '');
		if (message == '') return;

		var sentReply = (text: string) => {
			if (text == '' || text == null) return;
			var statusText = '@' + post.user.screen_name + ' ' + text;
			this.tweet(statusText, post.id_str);
		};

		// Command
		if (message[0] == '>') {
			sentReply(this.command(message));
			return;
		}

		// Calclation
		var expression = /^[0-9\.\(\)\+\-\*\/\^\%\s]{2,}/;
		if (message.match(expression)) {
			sentReply(eval(message.match(expression)[0]));
			return;
		}

		// 返信
		this.himawari.reply(message,(himawariAnswer: string) => {
			setTimeout(() => {
				sentReply(himawariAnswer);
			}, 3000 + Math.floor(Math.random() * 5000));
		});
	}

	/**
	  ダイレクトメッセージに返信します
	  @method replyDm
	  @param {any} dm - 返信先のダイレクトメッセージにオブジェクト
	  @return {void} 値を返しません
	  */
	public replyDm(dm: any): void {
		var message = dm.text;

		if (message == null) return;

		var sentReply = (text: string) => {
			if (text == '' || text == null) return;
			this.createDirectMessage(text, dm.sender.id_str);
		};

		// Command
		if (message[0] == '>') {
			sentReply(this.command(message));
			return;
		}

		// Calclation
		var expression = /^[0-9\(\)\+\-\*\/\^\%\s]{2,}/;
		if (message.match(expression)) {
			sentReply(eval(message.match(expression)[0]).toString());
			return;
		}

		// 返信
		this.himawari.reply(message,(himawariAnswer: string) => {
			setTimeout(() => {
				sentReply(himawariAnswer);
			}, 3000 + Math.floor(Math.random() * 5000));
		});
	}

	/**
	  覚えましたし
	  @method oboemashitashi
	  @return {void} 値を返しません
	  */
	public oboemashitashi(): void {
		if (this.recentTweet == null) return;

		var text = this.recentTweet.text;

		Himawari.morphologicalAnalyze(text,(result: string[][]) => {
			var keyword: string[] = null;
			async.each(result,(i: string[], callback: () => void) => {
				if (keyword == null && (i[2] == '固有名詞' || (i[1] == '名詞' && i[2] == '一般'))) {
					keyword = i;
				}
				callback();
			},(err: any) => {
					if (err) throw err;

					if (keyword != null && keyword[8] != null && keyword[8] != '*' && keyword[8] != keyword[0]) {
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
	public begin(tweet: (user: any, status: any) => void = null, reply: (user: any, status: any) => void = null, dm: (user: any, dm: any) => void = null) {
		var connect = () => {
			this.twitter.stream('user', { replies: 'all' },(stream: any) => {
				stream.on('data',(data: any) => {
					// ダイレクトメッセージ
					if (data.direct_message != null) {
						data.direct_message.text = data.direct_message.text.replace(/&gt;/g, '>');
						data.direct_message.text = data.direct_message.text.replace(/&lt;/g, '<');

						// 自分のDMは弾く
						if (data.direct_message.sender.screen_name == this.screenName) return;

						TwitterUser.find(this.name, data.direct_message.sender.id,(twitterUser: TwitterUser) => {
							if (twitterUser == null) {
								TwitterUser.create(this.name, data.direct_message.sender.id, data.direct_message.sender.name,(createdTwitterUser: TwitterUser) => {
									if (dm != null) dm(createdTwitterUser, data.direct_message);
								});
							}
							else {
								if (dm != null) dm(twitterUser, data.direct_message);
							}
						});
					}
					// ツイート
					else if (data.text != null) {
						
						// Web
						if (this.canServeWeb) {
							this.webStreamingSockets.forEach(function (socket: SocketIO.Socket) {
								socket.emit('tweet', data);
							});
						}

						data.text = data.text.replace(/&gt;/g, '>');
						data.text = data.text.replace(/&lt;/g, '<');
						var status: string = data.text;

						// 会話(リプライ)なら(ただし自分と自分宛てのリプライは除く)
						if (data.in_reply_to_status_id_str != null && data.user.screen_name != this.screenName && !status.match(new RegExp('^@' + this.screenName))) {
							// 学習するように設定されている場合は会話を学習する
							if (this.isStudent) {
								// 会話を学習するためにリプライ先のツイートを取得する
								this.twitter.get('statuses/show', { id: data.in_reply_to_status_id_str },(err: any, obj: any, res: any) => {
									if (err == null) {
										// 自分が関わっている場合は弾く
										if (obj.user.screen_name == this.screenName) return;
										if (data.user.screen_name == this.screenName) return;

										var q = trim(obj.text.replace(/@[a-zA-Z0-9_]+/g, ''));
										var a = trim(status.replace(/@[a-zA-Z0-9_]+/g, ''));

										if (this.studyTalkFilter(q)) return;
										if (this.studyTalkFilter(a)) return;

										q = this.trimStatus(q);
										a = this.trimStatus(a);

										// 会話を保存
										this.himawari.studyTalk(q, a);
									}
								});
							}
						}
						// 通常のツイートなら
						else {
							// 自分自信のツイートは弾く
							if (data.user.screen_name != this.screenName) {
								this.recentTweet = data;

								// 自分に対するリプライなら
								if (status.match(new RegExp('^@' + this.screenName))) {
									// ふぁぼっとく
									if (this.favReply)
										this.twitter.post('favorites/create', { id: data.id_str }, nullFunction);

									// フォローしてなかったらフォローしとく
									if (data.user.following == null && this.followWhenReceiveReply)
										this.twitter.post('friendships/create', { user_id: data.user.id_str, follow: false }, nullFunction);

									TwitterUser.find(this.name, data.user.id,(twitterUser: TwitterUser) => {
										if (twitterUser == null) {
											TwitterUser.create(this.name, data.user.id, data.user.name,(createdTwitterUser: TwitterUser) => {
												if (reply != null) reply(createdTwitterUser, data);
											});
										}
										else {
											if (reply != null) reply(twitterUser, data);
										}
									});
									return;
								}

								// エゴふぁぼRT
								if (status.indexOf(this.name) >= 0 && this.canEgoFavRt) {
									this.twitter.post('favorites/create', { id: data.id_str }, nullFunction);
									this.twitter.post('statuses/retweet/' + data.id_str, {}, nullFunction);
								}

								TwitterUser.find(this.name, data.user.id,(twitterUser: TwitterUser) => {
									if (tweet != null) tweet(twitterUser, data);
								});

								// 学習
								if (this.isStudent) {
									if (status.indexOf('@') >= 0) return;
									if (this.studyFilter(status)) return;

									status = this.trimStatus(status);
									this.himawari.study(status);
								}
							}
						}
					}
				});

				stream.on('error',(error: any) => {
					console.log(error);
					throw error;
				});

				return stream;
			});
		};

		var st: any = connect();

		setInterval(() => {
			st.destroy;
			st = connect();
		}, 86400000); // 24時間
	}
}
