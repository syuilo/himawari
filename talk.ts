/// <reference path="./typings/tsd.d.ts" />

import Himawari = require('./himawari');
import textFilter = require('./textFilters/himawari');

var himawari = new Himawari();
himawari.textFilter = textFilter;

himawari.comment("寒い", (comment: string) => {
	console.log(comment);
});
