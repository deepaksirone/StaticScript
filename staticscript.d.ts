
declare type int8 = {};
declare type int16 = {};
declare type int32 = {};
declare type int64 = {};
declare type int128 = {};

declare type uint8 = {};
declare type uint16 = {};
declare type uint32 = {};
declare type uint64 = {};
declare type uint128 = {};

declare type float32 = {};
declare type float64 = number;
declare type float128 = {};

interface Boolean {}

interface Function {}

interface IArguments {}

interface Number {
	toString()
}

interface Object {}

interface RegExp {}

interface String {}

interface Array<T> {
	length: number;
}

declare function puts(str: string): void;

declare function parseInt(str: string): number;

declare class Action {
	skip(): void;
}

declare class MomentJS {
	add(rhs: MomentJS): MomentJS;
	add(n: number, s: string): MomentJS;
	toString(): string;
}
declare function moment(): MomentJS;
declare function moment(t: MomentJS, format: string): MomentJS;
declare function moment(s: string, format: string): MomentJS;

declare class TriggerData {
	ConditionImageURL: string;
}

declare class Smartthings {
	static turnOnSmartthings: Action;
}

declare class Weather {
	static tomorrowsForecastCallsFor: TriggerData;
}

declare class placeAPhoneCallObj {
	OccurredAt: string;
	CallLength: string;
}

declare class AndroidPhone {
	static placeAPhoneCall: placeAPhoneCallObj;
}

declare class addDetailedEventObj {
	setEndTime(endtime: string);
}

declare class GoogleCalendar {
	static addDetailedEvent: addDetailedEventObj;
}
