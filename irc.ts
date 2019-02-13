import { Socket } from 'net';
import { Subject } from 'rxjs';
import {
    IAction,
    IChannelMode,
    IChannels,
    IJoinError,
    IJoinPart,
    IKick,
    IList,
    IMask,
    IMessage,
    INames,
    INick,
    INotice,
    IParams,
    IQuit,
    ISupport,
    ITopic,
    IWhois
} from './@types/irc';

export class Client extends Socket {

    public raw$ = new Subject<string>();
    public params: IParams;
    public connected = false;
    private requestQuit = false;
    private channels: IChannels = {};
    public registered$ = new Subject<boolean>();
    public message$ = new Subject<IMessage>();
    public action$ = new Subject<IAction>();
    public notice$ = new Subject<INotice>();
    private whois: IWhois = {};
    public whois$ = new Subject<IWhois>();
    private list: IList = [];
    public list$ = new Subject<IList>();
    public motd$ = new Subject<string[]>();
    public motd: string[] = [];
    private support: ISupport = {};
    public names$ = new Subject<INames>();
    private names: INames = { nicknames: {}};
    public topic$ = new Subject<ITopic>();
    private topic: ITopic = {};
    public join$ = new Subject<IJoinPart>();
    public part$ = new Subject<IJoinPart>();
    public kick$ = new Subject<IKick>();
    public joinError$ = new Subject<IJoinError>();
    public quit$ = new Subject<IQuit>();
    public error$ = new Subject<string>();
    public nick$ = new Subject<INick>();
    public positiveChannelMode$ = new Subject<IChannelMode>();
    public negativeChannelMode$ = new Subject<IChannelMode>();
    public buffer: string = '';

    constructor(params: IParams) {
        super();
        this.params = params;
        this.setEncoding('utf-8');
        this.conn();
        this.initializeEvent();
        this.initializeRaw();
    }

    private initializeEvent() {

        this.on('data', (data: any) => {
            if (this.buffer.substr(-2,2) !== '\r\n') {
                this.buffer += data;
            } else {
               this.buffer = data;
            }
            if (data.substr(-2,2) !== '\r\n') {
                return;
            }
            const lines = this.buffer.split('\r\n');
            for (const [index, line] of Object.entries(lines)) {
                if (Number(index) < lines.length - 1) {
                    this.raw$.next(line);
                }
            }
        });

        this.on('close', () => {
            this.connected = false;
            if (this.params.autoReco && !this.requestQuit) {
                setTimeout(() => {
                   this.conn();
                }, this.params.autoReco);
            }
        });

        this.on('error', (err: any) => {
            console.log(err);
        });
    }

    private initializeRaw() {
        this.raw$.subscribe((line: any) => {
            const data = line.split(' ');
            switch (data[0]) {
                case 'PING':
                    this.write(`PONG ${data[1]}\r\n`);
                    break;
            }
            switch (data[1]) {
                case '001':
                    this.rpl_welcome();
                    break;
                case '005':
                    this.rpl_isupport(data);
                    break;
                case 'JOIN':
                    this.JOIN(data);
                    break;
                case 'PART':
                    this.PART(data);
                    break;
                case 'KICK':
                    this.KICK(data);
                    break;
                case 'NICK':
                    this.NICK(data);
                    break;
                case 'QUIT':
                    this.QUIT(data);
                    break;
                case 'ERROR':
                    this.ERROR(data);
                    break;
                case 'MODE':
                    this.MODE(data);
                    break;
                case 'PRIVMSG':
                    this.privmsg(data);
                    break;
                case 'NOTICE':
                    this.notice(data);
                    break;
                case '311':
                    this.rpl_whoisuser(data);
                    break;
                case '312':
                    this.rpl_whoisserver(data);
                    break;
                case '313':
                    this.rpl_whoisoperator(data);
                    break;
                case '317':
                    this.rpl_whoisidle(data);
                    break;
                case '318':
                    this.rpl_endofwhois(data);
                    break;
                case '319':
                    this.rpl_whoischannels(data);
                    break;
                case '321':
                    this.rpl_liststart(data);
                    break;
                case '322':
                    this.rpl_list(data);
                    break;
                case '323':
                    this.rpl_listend(data);
                    break;
                case '332':
                    this.rpl_topic(data);
                    break;
                case '333':
                    this.rpl_topicwhotime(data);
                    break;
                case 'TOPIC':
                    this.TOPIC(data);
                    break;
                case '353':
                    this.rpl_namreply(data);
                    break;
                case '366':
                    this.rpl_endofnames(data);
                    break;
                case '375':
                    this.rpl_motdstart(data);
                    break;
                case '372':
                    this.rpl_motd(data);
                    break;
                case '376':
                    this.rpl_endofmotd(data);
                    break;
                case '405':
                    this.err_joinchannel(data);
                    break;
                case '473':
                    this.err_joinchannel(data);
                    break;
                case '474':
                    this.err_joinchannel(data);
                    break;
                case '475':
                    this.err_joinchannel(data);
                    break;
                case '476':
                    this.err_joinchannel(data);
                    break;
                case '477':
                    this.err_joinchannel(data);
                    break;
            }
        });
    }

    private rpl_welcome() {
        this.connected = true;
        this.registered$.next(true);
    }

    private rpl_isupport(data: string[]) {
        if (data.includes('NAMESX')) {
            this.support.NAMESX = true;
            this.send('PROTOCTL NAMESX');
        }
        if (data.includes('UHNAMES')) {
            this.support.UHNAMES = true;
            this.send('PROTOCTL UHNAMES');
        }
        for (const support of data.splice(3)) {
            const match = support.match(/([A-Z]+)=(.*)/);
            if (match) {
                const param = match[1];
                const value = match[2];
                switch (param) {
                    case 'PREFIX':
                        this.support.PREFIX = {};
                        const match =  value.match(/\((.*?)\)(.*)/);
                        if (match) {
                            const modes = match[1].split('');
                            const symbols = match[2].split('');
                            for (const [index, mode] of Object.entries(modes)) {
                                const symbol = symbols[Number(index)];
                                this.support.PREFIX[symbol] = mode;
                            }
                        }
                        if (this.params.autoJoin) {
                            this.join(this.params.autoJoin);
                        }
                        break;
                    case 'STATUSMSG':
                        this.support.STATUSMSG = value.split('');
                        break;
                    case 'MAXCHANNELS':
                        this.support.MAXCHANNELS = Number(value);
                        break;
                }
            }
        }
    }

    private rpl_motdstart(data: string[]) {
        this.motd = [];
    }

    private rpl_endofmotd(data: string[]) {
        this.motd$.next(this.motd);
        this.motd = [];
    }

    private rpl_motd(data: string[]) {
        const motd = this.string(data, 3);
        this.motd.push(motd.substr(1, motd.length));
    }

    private rpl_namreply(data: string[]) {
        if (this.support.PREFIX) {
            this.names.channel = data[4];
            data[5] = data[5].substr(1);
            data.splice(0, 5);
            data.splice(-1);
            for (const name of data) {
                const findModes: any = { mode: '' };
                const symbols = Object.keys(this.support.PREFIX);
                if (this.support.NAMESX) {
                    for (const [index, potentialSymbol] of Object.entries(name.split(''))) {
                        if (symbols.includes(potentialSymbol)) {
                            findModes.mode += potentialSymbol;
                        } else {
                            const { nickname, username, hostname } = this.parseMask(':' + name.substr(Number(index)));
                            findModes.nickname = nickname;
                            findModes.username = username;
                            findModes.hostname = hostname;
                            break;
                        }
                    }
                } else if (symbols.includes(name.substr(0, 1))) {
                    findModes.nickname = name.substr(1, name.length);
                    findModes.mode = name.substr(0, 1);
                } else {
                    findModes.nickname = name;
                    findModes.mode = '';
                }
                this.names.nicknames[findModes.nickname] = { modes: findModes.mode };
                if (findModes.username && findModes.hostname) {
                    this.names.nicknames[findModes.nickname].username = findModes.username;
                    this.names.nicknames[findModes.nickname].hostname = findModes.hostname;
                }
            }
        }
    }

    private rpl_endofnames(data: string[]) {
        if (this.names.channel) {
            this.channels[this.names.channel].users = this.names.nicknames;
            this.names$.next(this.names);
            this.names = { nicknames: {}};
        }
    }

    private rpl_topic(data: string[]) {
        this.topic.channel = data[3];
        this.topic.topic = this.string(data, 4).substr(1);
    }

    private rpl_topicwhotime(data: string[]) {
        this.topic.setBy = data[4];
        this.topic.date = Number(data[5]) * 1000;
        this.topic$.next(this.topic);
        this.channels[this.topic.channel].topic = this.topic;
        this.topic = {};
    }

    private TOPIC(data: string[]) {
        const { nickname } = this.parseMask(data[0]);
        this.topic.channel = data[2];
        this.topic.topic = data[3].substr(1);
        this.topic.setBy = nickname;
        this.topic.date = new Date().getTime();
        this.topic$.next(this.topic);
        this.channels[this.topic.channel].topic = this.topic;
        this.topic = {};
    }

    private rpl_whoisuser(data: string[]) {
        this.whois = {};
        this.whois.mask = this.string(data, 3);
    }

    private rpl_whoisserver(data: string[]) {
        this.whois.server = this.string(data, 3);
    }

    private rpl_whoisoperator(data: string[]) {
        this.whois.ircop = this.string(data, 3);
    }

    private rpl_whoisidle(data: string[]) {
        this.whois.idle = this.string(data, 3);
    }

    private rpl_endofwhois(data: string[]) {
        this.whois.endWhois = this.string(data, 3);
        this.whois$.next(this.whois);
        this.whois = {};
    }

    private rpl_whoischannels(data: string[]) {
        this.whois.channels = this.string(data, 3);
    }

    private rpl_liststart(data: string[]) {
        this.list = [];
    }

    private rpl_list(data: string[]) {
        let topic = this.string(data, 5);
        topic = topic.substr(2, topic.length);
        this.list.push({
            channel: data[3],
            users: data[4],
            topic,
        });
    }

    private rpl_listend(data: string[]) {
        this.list$.next(this.list);
        this.list = [];
    }

    private err_joinchannel(data: string[]) {
        this.joinError$.next({
            channel: data[3],
            error: this.string(data, 4).substr(1)
        });
    }

    private JOIN(data: string[]) {
        const {nickname, username, hostname} = this.parseMask(data[0]);
        const channel = data[2].replace(':', '');
        this.join$.next({ nickname, username, hostname, channel});
        if (nickname === this.params.nick) {
            this.channels[channel] = { users: {}};
        } else if (this.channels[channel] && this.channels[channel].users) {
            this.channels[channel].users[nickname] = { modes: '' };
        }
    }

    private PART(data: string[]) {
        const {nickname, username, hostname} = this.parseMask(data[0]);
        const channel = data[2].replace(':', '');
        this.part$.next({nickname, username, hostname, channel});
        if (nickname === this.params.nick) {
            delete this.channels[channel];
        } else if (this.channels[channel] && this.channels[channel].users) {
            delete this.channels[channel].users[nickname];
        }
    }

    private KICK(data: string[]) {
        const {server, nickname, username, hostname} = this.parseMask(data[0]);
        const channel = data[2];
        const to = data[3];
        const reason = data[4];
        this.kick$.next({server, nickname, username, hostname, channel, to, reason});
        if (to === this.params.nick && this.channels[channel]) {
            delete this.channels[channel];
        } else if (this.channels[channel] && this.channels[channel].users) {
            delete this.channels[channel].users[to];
        }
    }

    private NICK(data: string[]) {
        const {server, nickname, username, hostname} = this.parseMask(data[0]);
        const channels = this.isInTheChannels(nickname);
        const newnickname = data[2].substr(1);
        this.nick$.next({server, nickname, username, hostname, newnickname, channels});
        if (nickname === this.params.nick) {
            this.params.nick = newnickname;
        }
        for (const channel of channels) {
            if (this.channels[channel] && this.channels[channel].users[nickname]) {
                this.channels[channel].users[newnickname] = this.channels[channel].users[nickname];
                delete this.channels[channel].users[nickname];
            }
        }
    }

    private MODE(data: string[]) {
        const {nickname, username, hostname} = this.parseMask(data[0]);
        const modes = data[3].substr(1, data[3].length);
        const channel = data[2];
        const arg = this.string(data, 4);
        if (data[3].substr(0, 1) === '+') {
            for (const [index, mode] of Object.entries(modes.split(''))) {
                if (Object.values(this.support.PREFIX).includes(mode)) {
                    const nickArg = arg.split(' ')[Number(index)];
                    if (this.channels[channel].users &&
                        typeof this.channels[channel].users[nickArg] !== 'undefined') {

                        this.channels[channel].users[nickArg].modes += this.getSymbol(mode);
                    }
                }
            }
            this.positiveChannelMode$.next({ nickname, username, hostname, channel, modes, arg});

        } else if (data[3].substr(0, 1) === '-') {
            for (const [index, mode] of Object.entries(modes.split(''))) {
                if (Object.values(this.support.PREFIX).includes(mode)) {
                    const nickArg = arg.split(' ')[Number(index)];
                    if (this.channels[channel].users &&
                        this.channels[channel].users[nickArg].modes.search(this.getSymbol(mode)) > -1) {

                        const modes = this.channels[channel].users[nickArg].modes;
                        this.channels[channel].users[nickArg].modes = modes.replace(this.getSymbol(mode), '');
                    }
                }
            }
            this.negativeChannelMode$.next({ nickname, username, hostname, channel, modes, arg});
        }
    }

    private QUIT(data: string[]) {
        const mask = this.parseMask(data[0]);
        const channelsQuit = this.isInTheChannels(mask.nickname);
        if (mask.nickname === this.params.nick) {
            this.channels = {};
        }
        for (const channel of channelsQuit) {
            delete this.channels[channel].users[mask.nickname];
        }
        this.quit$.next({
            nickname: mask.nickname,
            message: this.string(data, 2).substr(1),
            channels: channelsQuit
        });
    }

    private ERROR(data: string[]) {
        this.channels = {};
        this.error$.next(data[1].substr(1));
    }

    private notice(data: string[]) {
        const { server, username, hostname, nickname } = this.parseMask(data[0]);
        const to = data[2];
        let notice = this.string(data, 3);
        notice = notice.substr(1, notice.length);
        this.notice$.next({server, username, hostname, nickname, to, notice});
    }

    private privmsg(data: string[]) {
        const { server, nickname, username, hostname} = this.parseMask(data[0]);
        const to = data[2];
        let message = this.string(data, 3);
        message = message.substr(1, message.length);
        if (message.substr(0, 7) === '\u0001ACTION' &&  message.substr(-1, 1) === '\u0001') {
            message = message.substr(8, message.length - 9)
            this.action$.next({server, username, hostname, nickname, to, message});
            return;
        } else if (message.substr(0, 1) === '\u0001' &&  message.substr(-1, 1) === '\u0001' && nickname) {
            this.ctcpReply(nickname, message.substr(1, message.length - 2));
            return;
        }
        this.message$.next({server, username, hostname, nickname, to, message});
    }

    public conn() {
        if (this.requestQuit) {
            delete this.requestQuit;
        }
        this.connect(this.params.port, this.params.host, () => {
            if (this.params.webirc && this.params.webirc.pass && this.params.webirc.host && this.params.webirc.ip) {
                this.write(`WEBIRC ${this.params.webirc.pass} ${this.params.username} ${this.params.webirc.host} ${this.params.webirc.ip}\r\n`);
            }
            if (this.params.password) {
                this.write(`PASS ${this.params.password}\r\n`);
            }
            this.write(`NICK :${this.params.nick}\r\n`);
            this.write(`USER ${this.params.username} * * :${this.params.realname}\r\n`);
        });
    }

    public disconnect(message: string) {
        this.requestQuit = true;
        this.send(`QUIT :${message}`);
    }

    public join(channel: string) {
        const channels = channel.split(',');
        for (let [index, channel] of Object.entries(channels)) {
            const numberChannel = Number(index) + 1;
            const prefixChannel = channel.substr(0, 1);
            const channelsLength = Object.keys(this.channels).length;
            const totalChannels = channelsLength + numberChannel;
            if (prefixChannel === '&' || prefixChannel === '#') {
                if (totalChannels <= this.support.MAXCHANNELS || !this.support.MAXCHANNELS) {
                    this.send(`JOIN ${channel}`);
                } else {
                    const error = 'You have joined too many channels.';
                    this.joinError$.next({channel, error});
                    return;
                }
            } else {
                const error = 'The channel prefix must be # or &.';
                this.joinError$.next({channel, error});
            }

        }
    }

    public part(channel: string) {
        switch (channel.substr(0, 1)) {
            case '#':
            case '&':
                this.send(`PART ${channel}`);
        }
    }

    public say(target: string, message: string) {
        this.send(`PRIVMSG ${target} :${message}`);
    }

    public ctcp(target: string, type: string) {
        this.send(`PRIVMSG ${target} :\u0001${type}\u0001`);
    }

    public action(target: string, message: string) {
        this.send(`PRIVMSG ${target} :\u0001ACTION ${message}\u0001`);
    }

    public send(command: string) {
        if (this.connected) {
            this.write(`${command}\r\n`);
        }
    }

    private parseMask(data: string) {
        const mask: IMask = {};
        const split = data.split(':');
        if (split) {
            mask.prefix = split[1];
            const match = mask.prefix.match(/^([_a-zA-Z0-9\~\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$/);
            if (match) {
                mask.nickname = match[1];
                mask.username = match[3];
                mask.hostname = match[4];
            } else {
                mask.server = mask.prefix;
            }
        }
        return mask;
    }

    private isInTheChannels(nickname: string) {
        const channelsKeys = Object.keys(this.channels);
        const channels = [];
        for (const channel of channelsKeys) {
            if (this.channels[channel].users &&
                typeof this.channels[channel].users[nickname] !== 'undefined') {

                channels.push(channel);
            }
        }
        return channels;
    }

    private ctcpReply(nickname: string, type: string) {
        if (type === 'VERSION') {
            this.send(`NOTICE ${nickname} :\u0001VERSION Dialova Client v1.00\u0001`);
        }
    }

    private string(data: string[], index: number) {
        return data.splice(index).join(' ');
    }

    private getSymbol(mode: string) {
        return Object.keys(this.support.PREFIX).find(key => this.support.PREFIX[key] === mode);
    }

}
