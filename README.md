## Basic usage

1/ Edit the app.ts file with your settings  
2/ npm install  
3/ npm start

## Full parameters example

```js
import { Client } from './irc';

const client = new Client({
    port: 6667,
    host: 'my-server.com',
    password: 'password-irc',
    nick: 'my-nickname',
    username: 'my-username',
    realname: 'my-realname',
    autoReco: 5000,
    autoJoin: '#my-channel',
    webirc: {
        pass: 'password-webirc',
        ip: '55.66.77.88',
        host: 'my-hostname.com'
    }
});
```

## Events 

```typescript
client.raw$.subscribe((data: string) => {
    
});

client.registered$.subscribe((data: boolean) => {
   
});

client.joinError$.subscribe((error: IJoinError) => {
    
});

client.message$.subscribe((data: IMessage) => {
     
});

client.action$.subscribe((data: IAction) => {
     
});

client.notice$.subscribe((data: INotice) => {
    
});

client.whois$.subscribe((data: IWhois) => {
    
});

client.list$.subscribe((data: IList) => {
   
});

client.motd$.subscribe((data: string[]) => {
   
});

client.names$.subscribe((data: INames) => {
   
});

client.topic$.subscribe((data: ITopic) => {
  
});

client.join$.subscribe((data: IJoinPart) => {
    
});

client.part$.subscribe((data: IJoinPart) => {
    
});

client.quit$.subscribe((data: IQuit) => {
     
});

client.nick$.subscribe((data: INick) => {
    
});

client.error$.subscribe((data: string) => {
   
});
```

## IRC Commands

```js
client.say('<#channel or user>', 'message');
client.join('#channel');
client.part('#channel');
client.ctcp('<#channel or user>', 'VERSION');
client.send('COMMAND ARG....');
```
