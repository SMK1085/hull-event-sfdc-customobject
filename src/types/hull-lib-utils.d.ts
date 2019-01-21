declare module 'hull/lib/utils' {
    import { RequestHandler } from "express";

    interface IOAuthHandlerConfig {
        name: string,
        tokenInUrl: boolean,
        isSetup: Function,
        onAuthorize: Function,
        onLogin: Function,
        Strategy: Function,
        views: any,
        options: any

    }
    export function oAuthHandler(config: IOAuthHandlerConfig): RequestHandler;
}