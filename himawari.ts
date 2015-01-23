/// <reference path="./typings/tsd.d.ts" />

/*
 * himawari - 向日葵 | マルコフ連鎖ベースのお手軽bot
 * Copyright (c) syuilo 'himawari' rights reserved
 */

var MeCab = require('mecab-async');
import async = require('async');

import StatusMarkovTable = require('./models/statusMarkovTable');
import QuestionMarkovTable = require('./models/questionMarkovTable');
import AnswerMarkovTable = require('./models/answerMarkovTable');
import Talk = require('./models/talk');

var trim = (text: string) =>
{
	return text.replace(/^[\s　]+|[\s　]+$/g, '');
}

export = Himawari;

/**
  himawari本体です
  @class Himawari
  */
class Himawari
{
	/**
	  マルコフ連鎖用テーブルのブロック開始デリミタ
	  @propety {string} markovBeginDelimiter
	  */
	public markovBeginDelimiter: string = '<begin>';

	/**
	  マルコフ連鎖用テーブルのブロック終了デリミタ
	  @propety {string} markovEndDelimiter
	  */
	public markovEndDelimiter: string = '<end>';

	/**
	  発言のフィルター
	  @propety {(text: string) => string} textFilter
	  */
	public textFilter: (text: string) => string = (text: string): string => { return text };

	/**
	  キーワードに応じた発言を取得します
	  @method comment
	  @param {string} keyword - キーワード
	  @param {(comment: string) => void} callback - コールバック
	  @param {number} [length] - 何ステップで文章を終了させるかを表す数値
	  @return {void} 値を返しません
	  */
	public comment(keyword: string, callback: (comment: string) => void, length: number = 1): void
	{
		// キーワードで始まるブロックを検索
		StatusMarkovTable.findByOne(keyword, (statusMarkovTables: StatusMarkovTable[]) =>
		{
			// キーワードで始まるブロックが見つかった場合
			if (statusMarkovTables != null)
			{
				this.think(keyword, length, (comment: string) =>
				{
					callback(trim(this.textFilter(comment)));
				});
			}
			// キーワードで始まるブロックが見つからなかった場合
			else
			{
				StatusMarkovTable.getRecentBeginPhrase((statusMarkovTable: StatusMarkovTable) =>
				{
					this.think(statusMarkovTable.two, length, (comment: string) =>
					{
						callback(trim(this.textFilter(comment)));
					});
				});
			}
		});
	}

	/**
	  リプに対する返信を取得します
	  @method reply
	  @param {string} text - 問い(リプ)
	  @param {(comment: string) => void} callback - コールバック
	  @param {number} [length] - 何ステップで文章を終了させるかを表す数値
	  @return {void} 値を返しません
	  */
	public reply(text: string, callback: (comment: string) => void, length: number = 1): void
	{
		text = trim(text);
		if (text == '')
		{
			callback(null);
			return;
		}

		// キーワードを抽出
		Himawari.getKeyword(text, (keyword: string) =>
		{
			// キーワードが見つかったら
			if (keyword != null)
			{
				// 抽出したキーワードを元に、受け取ったリプに似たリプ(Qとする)を探す
				QuestionMarkovTable.search(keyword, (qMarkovTables: QuestionMarkovTable[]) =>
				{
					// 見つかった場合
					if (qMarkovTables != null)
					{
						// ランダムに選択
						var r = Math.floor(Math.random() * qMarkovTables.length);
						var q = qMarkovTables[r];

						// Qに対する回答(Aとする)を探す(必ず質問と回答がセットで保存されるのでこれ(A)が見つからないことはない(はず))
						AnswerMarkovTable.searchAnswer(q.talkId, (a: AnswerMarkovTable) =>
						{
							// Aを復元
							Talk.find(a.talkId, (talk: Talk) =>
							{
								callback(trim(this.textFilter(talk.answer)));
							});
						});
					}
					// 似たリプ(Q)が見つからなかった場合
					else
					{
						// キーワードを起点とするマルコフ連鎖文章を適当に生成する
						this.think(keyword, length, (comment: string) =>
						{
							callback(trim(this.textFilter(comment)));
						});
					}
				});
			}
			// キーワードが見つかったら
			else
			{

			}
		});
	}

	/**
	  キーワードに基づいてマルコフ連鎖を行い文章を生成します
	  @method think
	  @param {string} keyword - キーワード
	  @param {number} length - 何ステップで文章を終了させるかを表す数値
	  @param {(text: string) => void} callback - コールバック
	  @return {void} 値を返しません
	  */
	public think(keyword: string, length: number, callback: (text: string) => void): void
	{
		var text = '';
		var searchFunction: (keyword: string, callback: (statusMarkovTables: StatusMarkovTable[]) => void) => void = null;

		// キーワードが終了デリミタならリターン
		if (keyword == this.markovEndDelimiter)
		{
			callback(text);
			return;
		}

		// lengthが0以下なら文章を終了できるブロックを検索するようにする
		if (length <= 0)
		{
			searchFunction = StatusMarkovTable.searchEnd;
		}
		else
		{
			searchFunction = StatusMarkovTable.findByOne;
		}

		// キーワードで始まるブロックを検索
		searchFunction(keyword, (statusMarkovTables: StatusMarkovTable[]) =>
		{
			// キーワードで始まるブロックが見つかった場合
			if (statusMarkovTables != null)
			{
				// そのなかからランダムに選択
				var r = Math.floor(Math.random() * statusMarkovTables.length);
				var statusMarkovTable = statusMarkovTables[r];

				// 選択したブロックに終了デリミタが含まれていない場合
				if (statusMarkovTable.three != this.markovEndDelimiter)
				{
					// 選択したブロックをテキストに足し、選択したブロックの最後をキーワードとして再帰 あとlengthを1つ減らしておく
					text += statusMarkovTable.one;
					text += statusMarkovTable.two;
					this.think(statusMarkovTable.three, length - 1, (nextText: string) =>
					{
						callback(text + nextText);
					});
				}
				// 選択したブロックに終了デリミタが含まれていた場合
				else
				{
					callback(statusMarkovTable.one + statusMarkovTable.two);
				}
			}
			// キーワードで始まるブロックが見つからなかった場合
			else
			{
				callback(keyword);
			}
		});
	}

	/**
	  発言を学習します
	  @method study
	  @param {string} status - 発言内容
	  @return {void} 値を返しません
	  */
	public study(status: string): void
	{
		if (status == null) return;

		// 形態素解析
		Himawari.morphologicalAnalyze(status, (result: string[][]) =>
		{
			//console.log(result);
			// 開始デリミタと終了デリミタを付与し3つの配列ずつに分ける
			Himawari.getTable([this.markovBeginDelimiter], [this.markovEndDelimiter], 3, result.map(x => x[0])).forEach((table: string[]) =>
			{
				if (table[0] != this.markovEndDelimiter && table[1] != this.markovEndDelimiter)
				{
					// DBに書き込む
					StatusMarkovTable.create(table[0], table[1], table[2], () => { });
				}
			});
		});
	}

	/**
	  会話を学習します
	  @method studyTalk
	  @param {string} q - Q
	  @param {string} a - A
	  @return {void} 値を返しません
	  */
	public studyTalk(q: string, a: string): void
	{
		if (q == null || a == null) return;

		// 会話の保存
		Talk.create(q, a, (insertId: number) =>
		{
			// Qの各要素の保存
			Himawari.morphologicalAnalyze(q, (result: string[][]) =>
			{
				Himawari.getTable([this.markovBeginDelimiter], [this.markovEndDelimiter], 3, result.map(x => x[0])).forEach((table: string[]) =>
				{
					if (table[0] != this.markovEndDelimiter && table[1] != this.markovEndDelimiter)
					{
						QuestionMarkovTable.create(insertId, table[0], table[1], table[2], () => { });
					}
				});
			});

			// Aの各要素の保存
			Himawari.morphologicalAnalyze(a, (result: string[][]) =>
			{
				Himawari.getTable([this.markovBeginDelimiter], [this.markovEndDelimiter], 3, result.map(x => x[0])).forEach((table: string[]) =>
				{
					if (table[0] != this.markovEndDelimiter && table[1] != this.markovEndDelimiter)
					{
						AnswerMarkovTable.create(insertId, table[0], table[1], table[2], () => { });
					}
				});
			});
		});
	}

	static getTable(begin: string[], end: string[], n: number, xs: string[])
	{
		return xs.map((x: string, i: number, xs: string[]) =>
		{
			return begin.concat(xs).concat(end).slice(i, i + n);
		});
	}

	/**
	  テキストからキーワードを抽出します
	  @method getKeyword
	  @param {string} source - テキスト
	  @param {(keyword: string) => void} callback - コールバック
	  @return {void} 値を返しません
	  */
	static getKeyword(source: string, callback: (keyword: string) => void): void
	{
		source = trim(source);
		if (source == '')
		{
			callback(null);
			return;
		}

		Himawari.morphologicalAnalyze(source, (result: string[][]) =>
		{
			var keywords: string[] = [];
			async.each(result, (i: string[], callback: () => void) =>
			{
				if (i[2] == '固有名詞' || (i[1] == '名詞' && i[2] == '一般'))
				{
					keywords.push(i[0]);
				}
				callback();
			}, (err: any) =>
				{
					if (err) throw err;

					var keyword = keywords.length > 0 ? keywords[Math.floor(Math.random() * keywords.length)] : result[0][0];
					callback(keyword);
				});
		});
	}

	/**
	  形態素解析を行います
	  @method analyze
	  @param {string} text - テキスト
	  @param {(result: any) => void} callback - コールバック
	  @return {void} 値を返しません
	  */
	static morphologicalAnalyze(text: string, callback: (result: any) => void): void
	{
		MeCab.parse(text, (err: any, result: any) =>
		{
			if (err)
			{
				throw err;
			}
			else
			{
				callback(result);
			}
		});
	}
}