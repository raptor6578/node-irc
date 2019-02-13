import {Client} from './irc';
import {IAction,
    IJoinError,
    IJoinPart,
    IList,
    IMessage,
    INames,
    INick,
    INotice,
    IQuit,
    ITopic,
    IWhois,
} from './types/irc';

const client = new Client({
    port: 6667,
    host: 'my-server.com',
    nick: 'my-nickname',
    username: 'my-username',
    realname: 'my-realname',
    autoJoin: '#my-channel',
});

client.raw$.subscribe((data: string) => {
    // console.log(data);
});

client.registered$.subscribe((data: boolean) => {
    if (data) {}
});

client.joinError$.subscribe((error: IJoinError) => {
    // console.log(error);
});

client.message$.subscribe((data: IMessage) => {
     // console.log(data);
});

client.action$.subscribe((data: IAction) => {
     // console.log(data);
});

client.notice$.subscribe((data: INotice) => {
    // console.log(data);
});

client.whois$.subscribe((data: IWhois) => {
    // console.log(data);
});

client.list$.subscribe((data: IList) => {
    // console.log(data);
});

client.motd$.subscribe((data: string[]) => {
   // console.log(data);
});

client.names$.subscribe((data: INames) => {
   // console.log(data);
});

client.topic$.subscribe((data: ITopic) => {
  // console.log(data);
});

client.join$.subscribe((data: IJoinPart) => {
    // console.log(data);
});

client.part$.subscribe((data: IJoinPart) => {
    // console.log(data);
});

client.quit$.subscribe((data: IQuit) => {
     // console.log(data);
});

client.nick$.subscribe((data: INick) => {
    // console.log(data);
});

client.error$.subscribe((data: string) => {
   // console.log(data);
});
