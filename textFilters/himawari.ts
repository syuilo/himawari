/// <reference path="../typings/tsd.d.ts" />

export = filter;

var filter = (text: string): string =>
{
	var gobi = {
		'です': 'ですx',
		'ですね': 'ですわね',
		'ます': 'ますx',
		'ますね': 'ますわね',
		'ません': 'ませんx',
		'ました': 'ました',
		'思った': '思いましたx',
		'てる': 'てますx',
		'ある': 'ありますx',
		'げる': 'げますx',
		'する': 'しますx',
		'たわ': 'しましたx',
		'たな': 'ましたx',
		'だな': 'ですわね',
		'えた': 'えましたx',
		'したか': 'しましたx',
		'てるわ': 'てますx',
		'てるぞ': 'てますx',
		'するぞ': 'しますx',
		'るぞ': 'りますx',
		'るわ': 'りますx',
		'だよ': 'ですのよ',
		'ない': 'ませんx',
		'ださい': 'ださりません？',
		'かも': 'かもしれませんx',
		'けど': 'けれど',
		'したら': 'したらどうです？',
		'したい': 'したいですわね',
		'たいわ': 'たいですわね',
		'しよう': 'しましょう',
		'しようか': 'しましょうか',
		'てくるよ': 'てきますわね',
		'てくるね': 'てきますわね',
		'てくるわ': 'てきますわね',
		'ろうか': 'りましょうか',
		'すのね': 'しますのね',
		'できない': 'できませんx',
		'なんだ': 'なんでしょう',
		'してた': 'してましたx',
		'えない': 'えませんx',
		"の\\?": 'んですの？',
		"の\\？": 'んですの？',
		"ね\\?": 'ね？',
		"ね\\？": 'ね？',
		"\\？": '？',
	};
	var gobiChange = false;

	text = text.replace(/俺/g, "私")
		.replace(/僕/g, "私")
		.replace(/お前/g, "あなた")
		.replace(/!/g, "")
		.replace(/！/g, "")
		.replace(/だよ/g, 'ですわよ')
		.replace(/です/g, 'ですわ')
		.replace(/ます/g, 'ますわ')
		.replace(/しまった/g, "しまいましたわ")
		.replace(/くれる/g, "くださる")
		.replace(/だけど/g, "ですけれど")
		.replace(/だっけ/g, "でしたっけ")
		.replace(/だ$/g, '')
		.replace(/～+$/g, '')
		.replace(/ー+$/g, '')
		.replace(/w+$/g, '')
		.replace(/ｗ+$/g, '')
		.replace(/。+$/g, '');

	for (var key in gobi)
	{
		var regexp = new RegExp(key + '$');
		if (text.match(regexp) && !gobiChange)
		{
			gobiChange = true;
			var before: string = gobi[key];
			var beforeGobi = "";
			switch (Math.floor(Math.random() * 3))
			{
				case 0:
					beforeGobi = 'わ';
					break;
				case 1:
					beforeGobi = 'わね';
					break;
				case 2:
					beforeGobi = 'の';
					break;
			}
			before = before.replace(/x/g, beforeGobi);
			text = text.replace(regexp, before);
			break;
		}
	}

	if (!gobiChange)
	{
		gobiChange = true;
		switch (Math.floor(Math.random() * 3))
		{
			case 0:
				break;
			case 1:
				text += 'ですわ';
				break;
			case 2:
				text += 'ですの';
				break;
		}
	}

	text = text.replace(/たです/g, "たんです");
	text = text.replace(/るです/g, "るんです");

	return text;
}