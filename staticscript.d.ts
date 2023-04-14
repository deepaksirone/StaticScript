

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

interface RegExp {
	test(s: string): boolean;
}

interface String {
	concat(s: string): string;
	replace(s: RegExp, t: string): string;
	constructor(f: number): string;
	indexOf(s: string): number;
	split(s: string): Array<string>;
	trim(): string;
	charAt(n: number): string;
	slice(start: number, end: number): string;
	length: number;
	match(s: string): Array<string>;
	match(r: RegExp): Array<string>;
	
}

interface Array<T> {
	length: number;
	join(s: string): string;
	toString(): string;
	indexOf(s: number): number;
	slice(start: number, end: number): Array<string>;
}

declare function puts(str: string): void;


declare function parseInt(str: string): number;
declare function parseFloat(str: string): number;
declare function parseFloat(s: number): number;
declare function String(n: number): string;
declare function Number(): number;
declare function RegExp(s: string): RegExp;

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

declare class Date {
	constructor();
	constructor(d: Date);
}

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

declare class eventEndsObj {
	Title: string;
}

declare class GoogleCalendar {
	static addDetailedEvent: addDetailedEventObj;
	static anyEventEnds: eventEndsObj;
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
	static turnOnAllHue: Action;
	static toggleAllHue: Action;
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

declare class AddTrackToPlaylist {
	setSearchQuery(s: string);
	setArtistName(s: string);
	skip();
}

declare class Spotify {
	static newTrackAddedToPlaylist: SpotifyTrackPlayListAdded;
	static addATrackToAPlaylist: AddTrackToPlaylist;
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

declare class newTweetWithImage {
	setTweet(s: string);
	setPhotoUrl(s: string);
}

declare class Twitter {
	static postNewTweet: Tweet;
	static postNewTweetWithImage: newTweetWithImage;
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

declare class GooglePhoto {
	PhotoUrl: string;
	Filename: string;
}

declare class GoogleDrive {
	static anyNewPhoto: GooglePhoto;
}

declare class photoFromUrl {
	setPhotoUrl(s: string);
	setTitle(s: string);
	setDescription(s: string);
	setTags(s: string);
}


declare class Flickr {
	static uploadPublicPhotoFromUrl: photoFromUrl;
}

declare class TumblrPhotoPost {
	setSourceUrl(s: string);
	setCaption(s: string);
	setTags(s: string);
}

declare class Tumblr {
	static createPhotoPost: TumblrPhotoPost;
}

declare class WemoSwitch {
	static attributeSocketOnDiscrete: Action;
}


declare class RedditPost {
	Title: string;
}

declare class Reddit {
	static newHotPostInSubreddit: RedditPost;
	static submitLinkReddit: Action;
}

declare class Yeelight {
	static setScene: Action;
}