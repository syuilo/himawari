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
		'てるわ': 'ますx',
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
		.replace(/!/g, "")
		.replace(/！/g, "")
		.replace(/しまった/g, "しまいましたわ")
		.replace(/くれる/g, "くださる")
		.replace(/だけど/g, "ですけれど")
		.replace(/だっけ/g, "でしたっけ")
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