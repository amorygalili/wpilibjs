/**
 * NetworkTables 4.1 data types
 */
export enum DataType {
  Boolean = 0,
  Double = 1,
  Integer = 2,
  Float = 3,
  String = 4,
  Raw = 5,
  BooleanArray = 16,
  DoubleArray = 17,
  IntegerArray = 18,
  FloatArray = 19,
  StringArray = 20
}

/**
 * NetworkTables 4.1 string type identifiers
 */
export enum StringType {
  String = 'string',
  Json = 'json'
}

/**
 * NetworkTables 4.1 raw type identifiers
 */
export enum RawType {
  Raw = 'raw',
  Rpc = 'rpc',
  MsgPack = 'msgpack',
  Protobuf = 'protobuf'
}

/**
 * NetworkTables 4.1 value
 */
export interface Value {
  type: DataType;
  value: any;
  time: number; // Timestamp in microseconds
}

/**
 * NetworkTables 4.1 topic properties
 */
export interface Properties {
  persistent?: boolean;
  retained?: boolean;
  cached?: boolean;
  [key: string]: any;
}

/**
 * NetworkTables 4.1 publish/subscribe options
 */
export interface PubSubOptions {
  prefixMatch?: boolean;
  topicsOnly?: boolean;
  sendAll?: boolean;
}

/**
 * NetworkTables 4.1 client message types
 */
export enum ClientMessageType {
  Publish = 'publish',
  Unpublish = 'unpublish',
  SetProperties = 'setproperties',
  Subscribe = 'subscribe',
  Unsubscribe = 'unsubscribe'
}

/**
 * NetworkTables 4.1 server message types
 */
export enum ServerMessageType {
  Announce = 'announce',
  Unannounce = 'unannounce',
  Properties = 'properties'
}

/**
 * NetworkTables 4.1 client publish message
 */
export interface PublishMessage {
  method: ClientMessageType.Publish;
  params: {
    name: string;
    type: string;
    pubuid: number;
    properties: Properties;
  };
}

/**
 * NetworkTables 4.1 client unpublish message
 */
export interface UnpublishMessage {
  method: ClientMessageType.Unpublish;
  params: {
    pubuid: number;
  };
}

/**
 * NetworkTables 4.1 client set properties message
 */
export interface SetPropertiesMessage {
  method: ClientMessageType.SetProperties;
  params: {
    name: string;
    update: Properties;
  };
}

/**
 * NetworkTables 4.1 client subscribe message
 */
export interface SubscribeMessage {
  method: ClientMessageType.Subscribe;
  params: {
    subuid: number;
    topics: string[];
    options?: PubSubOptions;
  };
}

/**
 * NetworkTables 4.1 client unsubscribe message
 */
export interface UnsubscribeMessage {
  method: ClientMessageType.Unsubscribe;
  params: {
    subuid: number;
  };
}

/**
 * NetworkTables 4.1 server announce message
 */
export interface AnnounceMessage {
  method: ServerMessageType.Announce;
  params: {
    name: string;
    id: number;
    type: string;
    pubuid?: number;
    properties: Properties;
  };
}

/**
 * NetworkTables 4.1 server unannounce message
 */
export interface UnannounceMessage {
  method: ServerMessageType.Unannounce;
  params: {
    name: string;
    id: number;
  };
}

/**
 * NetworkTables 4.1 server properties message
 */
export interface PropertiesMessage {
  method: ServerMessageType.Properties;
  params: {
    name: string;
    properties: Properties;
  };
}

/**
 * NetworkTables 4.1 client message
 */
export type ClientMessage = 
  | PublishMessage
  | UnpublishMessage
  | SetPropertiesMessage
  | SubscribeMessage
  | UnsubscribeMessage;

/**
 * NetworkTables 4.1 server message
 */
export type ServerMessage = 
  | AnnounceMessage
  | UnannounceMessage
  | PropertiesMessage;

/**
 * NetworkTables 4.1 binary message
 */
export interface BinaryMessage {
  topicId: number;
  timestamp: number;
  type: DataType;
  value: any;
}

/**
 * NetworkTables 4.1 topic
 */
export interface Topic {
  name: string;
  id: number;
  type: string;
  properties: Properties;
  value?: Value;
}

/**
 * NetworkTables 4.1 subscription
 */
export interface Subscription {
  id: number;
  topics: string[];
  options: PubSubOptions;
}

/**
 * NetworkTables 4.1 publication
 */
export interface Publication {
  id: number;
  name: string;
  type: string;
  properties: Properties;
}
