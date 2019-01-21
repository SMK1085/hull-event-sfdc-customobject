declare module 'hull' {
    import { Logger, loggers } from "winston";
    import { Application } from "express";

    const logger: Logger;
    class Connector {
        constructor(config: any);
        public setupApp(app: Application): void;
        public startApp(app: Application): void;
    }
}