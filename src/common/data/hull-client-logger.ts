export default interface IHullClientLogger {
    log: (message: string, ...optionalParams: any[]) => void;
    silly: (message: string, ...optionalParams: any[]) => void;
    debug: (message: string, ...optionalParams: any[]) => void;
    verbose: (message: string, ...optionalParams: any[]) => void;
    info: (message: string, ...optionalParams: any[]) => void;
    warn: (message: string, ...optionalParams: any[]) => void;
    error: (message: string, ...optionalParams: any[]) => void;
};
