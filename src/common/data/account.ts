import { HullAttribute } from "./common-types";

export interface IHullAccountClaims {
    id?: string;
    domain?: string;
    external_id?: string;
}

export default interface IHullAccount {
    id: string;
    domain: string;
    external_id: string;
    [propName: string]: HullAttribute;
}