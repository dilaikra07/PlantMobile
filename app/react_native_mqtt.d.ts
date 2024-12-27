// react_native_mqtt.d.ts
declare module 'react_native_mqtt' {
  export function init(options: {
    size?: number;
    storageBackend?: any;
    defaultExpires?: number;
    enableCache?: boolean;
    reconnect?: boolean;
  }): void;

  export class Client {
    constructor(host: string, port: number, clientId: string);
    connect(options: { onSuccess: () => void; onFailure?: (error: any) => void }): void;
    disconnect(): void;
    subscribe(topic: string): void;
    unsubscribe(topic: string): void;
    send(message: any): void;
    onConnectionLost: (responseObject: any) => void;
    onMessageArrived: (message: any) => void;
  }
}
