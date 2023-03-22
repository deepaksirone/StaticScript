

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
	toString(): string;
	toFixed(n: number): number;
	constructor(): number;
}

interface Object {}

interface RegExp {}

interface String {
	concat(s: string): string;
	replace(s: RegExp, t: string): string;
	constructor(f: number): string;
	indexOf(s: string): number;
	length: number;
	match(s: string): Array<string>;
}

interface Array<T> {
	length: number;
	join(s: string): string;
	toString(): string;
}

declare function puts(str: string): void;


declare function parseInt(str: string): number;
declare function parseFloat(str: string): number;
declare function parseFloat(s: number): number;
declare function String(n: number): string;
declare function Number(): number;

declare class Action {
	skip(): void;
	skip(s: string): void;
}

declare class MomentJS {
	add(rhs: MomentJS): MomentJS;
	add(n: number, s: string): MomentJS;
	toString(): string;
	day(): number;
	hour(): number;
	constructor();
	constructor(s: string);
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

declare class LutronCasetaWireless {
	static setScene: Action;
}

declare class BufferPhoto {
	setPhotoUrl(s: string);
	setMessage(m: string);
}

declare class Buffer {
	static addToBufferWithPhoto: BufferPhoto;
}

declare class NestThermostat {
	static setTemperature: Action;
}

declare class Hue {
	static setColorAllHue: Action;
}

declare class IfNotifications {
	static sendNotification: Action;
}

declare class Skybell {
	static record60sOfVideo: Action;
}

declare class Email {
	static sendMeEmail: Action;
}

declare class SpotifyTrackPlayListAdded {
	AddedBy: string;
	TrackName: string;
	TrackURL: string;
	ArtistName: string;
	AlbumName: string;
	PlaylistName: string;
}

declare class Spotify {
	static newTrackAddedToPlaylist: SpotifyTrackPlayListAdded;
}

declare class Gmail {

}

declare class Trigger {
	static LinkToProfile: string;
	static EntryTitle: string;
	static Text: string;
}

declare class Tweet {
	setTweet(s: string);
	skip();
}

declare class Twitter {
	static postNewTweet: Tweet;
}

declare class FeedEntry {
	EntryTitle: string;
}

declare class Feed {
	static newFeedItem: FeedEntry;
}

declare class Telegram {
	static sendMessage: Action;
}

declare class Evernote {
	static appendToNote: Action;
}

