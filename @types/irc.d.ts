export interface IParams {
    port: number;
    host: string;
    password?: string;
    nick: string;
    username: string;
    realname: string;
    autoReco?: number;
    autoJoin?: string;
    webirc?: {
        pass?: string;
        ip?: string;
        host?: string;
    };
}

export interface IMask {
    nickname?: string;
    username?: string;
    hostname?: string;
    prefix?: string;
    server?: string;
}

export interface IWhois {
    mask?: string;
    channels?: string;
    server?: string;
    ircop?: string;
    idle?: string;
    endWhois?: string;
}

export interface IList extends Array<object> {
    [index: number]: {
        channel: string;
        users: number;
        topic: string;
    };
}

export interface ISupport {
    STATUSMSG?: string[];
    PREFIX?: {
        [key: string]: string;
    };
    MAXCHANNELS?: number;
    NAMESX?: boolean;
    UHNAMES?: boolean;
}

export interface INames {
    channel?: string;
    nicknames: INamesNicknames;
}

interface INamesNicknames {
    [key: string]: {
        modes: string;
        username?: string;
        hostname?: string;

    }
}

export interface ITopic {
    channel?: string;
    topic?: string;
    setBy?: string;
    date?: number;
}

export interface IJoinPart {
    nickname: string;
    username: string;
    hostname: string;
    channel: string;
}

export interface IChannels {
    [key: string]: {
        users?: INamesNicknames;
        topic?: ITopic;
    };
}

export interface IQuit {
    nickname: string;
    message: string;
    channels: string[];

}

export interface IChannelMode {
    nickname: string;
    username: string;
    hostname: string;
    channel: string;
    modes: string;
    arg: string;
}

export interface IMessage {
    server: string;
    nickname: string;
    username: string;
    hostname: string;
    to: string;
    message: string;
}

export interface INotice {
    server: string;
    nickname: string;
    username: string;
    hostname: string;
    to: string;
    notice: string;
}

export interface IAction {
    server: string;
    nickname: string;
    username: string;
    hostname: string;
    to: string;
    message: string;
}

export interface IJoinError {
    channel: string;
    error: string;
}

export interface IKick {
    server: string;
    nickname: string;
    username: string;
    hostname: string;
    channel: string;
    to: string;
    reason: string;
}

export interface INick {
    server: string;
    nickname: string;
    username: string;
    hostname: string;
    newnickname: string;
    channels: string[];
}
