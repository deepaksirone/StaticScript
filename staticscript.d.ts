

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
	toFixed(n: number): string;
	constructor(): number;
}

interface Object {}

interface RegExp {
	test(s: string): boolean;
	exec(s: string): Array<string>;
}

interface String {
	concat(s: string): string;
	replace(s: RegExp, t: string): string;
	replace(s: string, t: string): string;
	constructor(f: number): string;
	indexOf(s: string): number;
	split(s: string): Array<string>;
	trim(): string;
	charAt(n: number): string;
	slice(start: number, end: number): string;
	slice(dist_from_end: number): string;
	length: number;
	match(s: string): Array<string>;
	match(r: RegExp): Array<string>;
	toUpperCase(): string;
	toLowerCase(): string;
	substr(start: number, end: number): string;
	search(t: RegExp): number;
	search(s: string): number;
	lastIndexOf(s: string): number;
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
declare function parseInt(str:string, base: number): number;
declare function parseFloat(str: string): number;
declare function parseFloat(s: number): number;
declare function String(n: number): string;
declare function Number(): number;
declare function Number(s: string): number;
declare function RegExp(s: string): RegExp;
declare function RegExp(r: RegExp): RegExp;

declare function encodeURI(s: string): string;

declare class Action {
	skip(): void;
	skip(s: string): void;
	setMessage(s: string);
	setIssueTitle(s: string);
	setIssueBody(s: string);
	setText(s: string);
}

declare class MomentJS {
	add(rhs: MomentJS): MomentJS;
	add(n: number, s: string): MomentJS;
	toString(): string;
	day(): number;
	hour(): number;
	hour(n: number): MomentJS;
	minute(n: number): MomentJS;
	constructor();
	constructor(s: string);
}
declare function moment(): MomentJS;
declare function moment(t: MomentJS, format: string): MomentJS;
declare function moment(s: string, format: string): MomentJS;

declare class Date {
	constructor();
	constructor(d: Date);
	constructor(s: string);
	getDay(): number;
}

declare class TriggerData {
	ConditionImageURL: string;
}

declare class Smartthings {
	static turnOnSmartthings: Action;
}

declare class currentWeather {
	HighTempCelsius: number;
	Condition: string;
	TodaysCondition: string;
}

declare class Weather {
	static tomorrowsForecastCallsFor: TriggerData;
	static currentWeatherAtTime: currentWeather;
	static currentConditionIs: currentWeather;

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
	setStartTime(s: string);
	setDescription(s: string);
}

declare class eventEndsObj {
	Title: string;
}

declare class quickAddEventObj {
	skip();
	setQuickAdd(s: string);
}

declare class GoogleCalendar {
	static addDetailedEvent: addDetailedEventObj;
	static anyEventEnds: eventEndsObj;
	static quickAddEvent: quickAddEventObj;
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

declare class awayFromHomeObj {
	HomeName: string;
	SetAt: string;
}

declare class NestThermostat {
	static setTemperature: Action;
	static awayFromHome: awayFromHomeObj;
}

declare class HueColor {
	skip(s: string);
	skip();
	setColor(s: string);
}

declare class Hue {
	static setColorAllHue: HueColor;
	static setScene: Action;
	static turnOnAllHue: Action;
	static toggleAllHue: Action;
}

declare class IfNotifications {
	static sendNotification: Action;
	static sendRichNotification: Action;
}

declare class Skybell {
	static record60sOfVideo: Action;
}

declare class sendMeEmailObj {
	skip();
	setSubject(s: string);
	setBody(s: string);
}

declare class Email {
	static sendMeEmail: sendMeEmailObj;
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
	setPlaylist(s: string);
	skip();
	skip(s: string);
}

declare class Spotify {
	static newTrackAddedToPlaylist: SpotifyTrackPlayListAdded;
	static addATrackToAPlaylist: AddTrackToPlaylist;
	static newRecentlyPlayedTrack: SpotifyTrackPlayListAdded;
}

declare class Gmail {
	static sendAnEmail: Action;
}

declare class Trigger {
	static LinkToProfile: string;
	static EntryTitle: string;
	static Text: string;
	static DeviceName: string;
	static Title: string;
	static CreatedAt: string;
	static Description: string;
	static AddedItem: string;
}

declare class Tweet {
	setTweet(s: string);
	skip();
	skip(s: string);
	CreatedAt: string;
	Text: string;
	LinkToTweet: string;

}

declare class newTweetWithImage {
	setTweet(s: string);
	setPhotoUrl(s: string);
	skip();
}

declare class Twitter {
	static postNewTweet: Tweet;
	static postNewTweetWithImage: newTweetWithImage;
	static newTweetByUser: Tweet;
	static newTweetFromSearch: Tweet;
}

declare class FeedEntry {
	EntryTitle: string;
	EntryContent: string;
}

declare class Feed {
	static newFeedItem: FeedEntry;
	static newFeedItemMatches: FeedEntry;
}

declare class sendMsgObj {
	skip(): void;
	skip(s: string): void;
	setText(s: string);
	setIncludeWebPagePreview(s: string);
}

declare class Telegram {
	static sendMessage: sendMsgObj;

}

declare class EvernoteNote {
	skip();
	skip(s: string);
	setTitle(s: string);

}

declare class Evernote {
	static appendToNote: EvernoteNote;
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
	skip();
}

declare class Tumblr {
	static createPhotoPost: TumblrPhotoPost;
}

declare class WemoSwitch {
	static attributeSocketOnDiscrete: Action;
	static attributeSocketOffDiscrete: Action;
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
	static onOff: YeelightOnOff;
}

declare class VideoDesc {
	Title: string;
}

declare class Youtube {
	static newPublicVideoFromSubscriptions: VideoDesc;
}

declare class sensData {
	Moisture: string;
}

declare class Netro {
	static sensorData: sensData;
	static noWater: Action;
	static reportWeather: WeatherObj;
	static water: Action;
}

declare class alertTime {
	AlertTime: string;
}

declare class AmazonAlexa {
	static alarmFired: alertTime;
}

declare class callDevice {
	setMessage(s: string);
	skip(s: string);
	skip();
}

declare class VoipCalls {
	static callMyDevice: callDevice;
}

declare class InstagramVideo {
	Caption: string;
}

declare class InstagramPhoto {
	CreatedAt: string;
}

declare class Instagram {
	static anyNewVideoByYouInstagram: InstagramVideo;
	static anyNewPhotoByYou: InstagramPhoto;
}

declare class PhotoPage {
	skip();
}

declare class StatusMessage {
	Message: string;
	PageUrl: string;
}

declare class FacebookPages {
	static createPhotoPage: PhotoPage;
	static newStatusMessageByPage: StatusMessage;
}


declare class createFeedly {
	skip(s: string);
}
declare class Feedly { 
	static createNewEntryFeedly: createFeedly;
}

declare class RoosterTransfer {
	setAmount(s: string);
}

declare class RoosterCardSpend {
	SpendAmountDecimal: string;
}

declare class Roostermoney {
	static cardSpend: RoosterCardSpend;
	static transfer: RoosterTransfer; 
}

declare class WemoStatus {
	SwitchName: string;
	SwitchedOffAt: string;
}

declare class WemoInsightSwitch {
	static attributeINSIGHTOFFN: WemoStatus;
	static attributeInsightOnDiscrete: Action;
}

declare class GoogleSpreadSheet {
	setFormattedRow(s: string);
	skip();
}

declare class GoogleSheetRow {
	ColumnA: string;
	ColumnB: string;
	ColumnC: string;
}

declare class GoogleSheets {
	static appendToGoogleSpreadsheet: GoogleSpreadSheet;
	static newRowInSpreadsheet: GoogleSheetRow;
}

declare class UploadBox {
	skip(s: string);
}

declare class Box {
	static uploadFileFromUrlBox: UploadBox;
}

declare class deviceVolume {
	skip(s: string);
}

declare class androidBluetooth {
	DeviceName: string;
}

declare class AndroidDevice {
	static setDeviceVolume: deviceVolume;
	static bluetoothConnected: androidBluetooth;
	static playBestSong: Action;
}

declare class AndroidMessage {
	Text: string;
}

declare class AndroidMessages {
	static sendAMessage: Action;
	static receivedAMessageFromNumber: AndroidMessage;
	static receivedAMessage: AndroidMessage;
}

declare class photoPost {
	setTitle(s: string);
}

declare class Wordpress {
	static createPhotoPostWp: photoPost;
}

declare class lightOn {
	skip();
}

declare class HiveActiveLight {
	static setLightOn: lightOn;
}

declare class DCUTransaction {
	Amount: string;
	TransactionDetail: string;
}

declare class DCUPlaidIFTTT {
	static newTransactions: DCUTransaction;
}

declare class smsMessage {
	setMessage(s: string);
	skip();
	skip(s: string);
}

declare class Sms {
	static sendMeText: smsMessage;
}

declare class collarInfoClass {
	CreatedAt: string;
	Battery: string;
}

declare class LinkMyPet {
	static collarInfo: collarInfoClass;
}

declare class YeelightOnOff {
	setOnOffOption(s: string);
	skip(s: string);
}

declare class MonzoPotDeposit {
	setAmount(s: string);
}

declare class MonzoCardPurchase {
	Category: string;
	MerchantName: string;
	AccountCurrencyCode: string;
	LocalCurrencyCode: string;
	AmountInAccountCurrency: string;
}

declare class MonzoPotWithdraw {
	skip();
	setAmount(s: string);
}

declare class Monzo {
	static potDeposit: MonzoPotDeposit;
	static cardPurchase: MonzoCardPurchase;
	static potWithdraw: MonzoPotWithdraw;
}

declare class StripeNewTransfer {
	Amount: string;
}

declare class Stripe {
	static newTransfer: StripeNewTransfer;
}

declare class MadeDonationObj {
	skip();
}

declare class MakeItDonate {
	static makeADonation: MadeDonationObj;
}

declare class EwelinkAction {
	skip();
	skip(s: string);
}

declare class Ewelink {
	static switchAction: EwelinkAction;
	static plugAction: EwelinkAction;
}

declare class dataFromTheBea {
	EntryTitle: string;
}

declare class Bea {
	static newDataFromTheBea: dataFromTheBea;
}

declare class Github {
	static createNewIssueForRepository: Action;
}

declare class PhoneCall {
	static callMyPhone: Action;
}

declare class TriggerWithOneTextObj {
	TextField: string;
	CreatedAt: string;
}

declare class GoogleAssistant {
	static voiceTriggerWithOneTextIngredient: TriggerWithOneTextObj;
}

declare class WeatherObj {
	setDate(s: string);
	setRain(s: string);
	setRainProb(s: string);
}

declare class rainToday {
	MeasuredAt: string;
	MeasuredRainfallMM: string;
}

declare class Netatmo {
	static rainTodayAmount: rainToday;
	static rainYesterdayAmount: rainToday;
}

declare class SlackPostChannel {
	skip();
	skip(s: string);
	setMessage(s: string);
}

declare class Slack {
	static postToChannel: SlackPostChannel;
}


declare class readLaterObj {
	skip(s: string);
	setUrl(s: string);
}

declare class PocketItem {
	Title: string;
	Url: string;
	Excerpt: string;
	Tags: string;
	AddedAt: string;
}

declare class Pocket {
	static readItLater: readLaterObj;
	static newItemAddedPocket: PocketItem;
}

declare class Line {
	static sendMessage: Action;
}

declare class WemoLightSwitch {
	static attributeLsOnDiscrete: Action;
}

declare class dominosOrder {
	skip();
}

declare class Dominos {
	static launchEasyOrder: dominosOrder;
}

declare class GoogleDoc {
	Body: string;
	skip();
}


declare class GoogleDocs {
	static newDocument: GoogleDoc;
	static appendToGoogleDoc: GoogleDoc;

}

declare class LifxColor {
	setAdvancedOptions(s: string);
}


declare class Lifx {
	static color:  LifxColor;
	static turnOn: Action;
	static breathe: LifxColor;
}


declare class NestThermostatPoint {
	TemperatureSetpoint: string;
}

declare class NetatmoThermostat { 
	static getsetpointmanual: NestThermostatPoint;
}

declare class DaikinOnControl {
	setSetpoint(s: string);
	skip();
}

declare class DaikinOffControl {
	setSetpoint(s: string);
	skip();
}

declare class DaikinOnlineController {
	static turnAcUnitOn: DaikinOnControl;
	static turnUnitOff: DaikinOffControl;
}

declare class Smartlife {
	static turnOn: Action;
}

declare class buttonNewCommandCommon {
	Latitude: string;
	Longitude: string;
}

declare class DoButton {
	static doButtonNewCommandCommon: buttonNewCommandCommon;
}

declare class NetindicatorPortfolio {
	Increase: string;
}

declare class Netindicator {
	static portfolio: NetindicatorPortfolio;
}

declare class StravaActivity {
	DistanceMeters: string;
}

declare class Strava {
	static newActivityByYou: StravaActivity;
}

declare class TodoistTask {
	setTaskContent(s: string);
	setNote(s: string);
}

declare class Todoist {
	static createTask: TodoistTask;
}

declare class IosCalendar {
	static createCalendarEvent: Action;
}

declare class ArloRecord {
	skip(s: string);
	skip();
}

declare class Arlo {
	static record: ArloRecord;
}

declare class LocationObj {
	EnteredOrExited: string;
}

declare class Location {
	static enterOrExitRegionLocation: LocationObj;

}

declare class cameraAction {
	skip();
}

declare class InvidyoTest {
	static turnOnCamera: cameraAction;
	static turnOffCamera: cameraAction;
}

declare class doNoteObj {
	NoteText: string;
}

declare class DoNote {
	static doNoteNewCommandCommon: doNoteObj;
}

declare class IosRemindersObj {
	setTitle(s: string);
	setList(s: string);
}

declare class IosReminders {
	static createReminderIosReminders: IosRemindersObj;
}

declare class MagicLight {
	static changeColor: Action;
}