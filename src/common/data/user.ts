import { HullAttribute } from "./common-types";

export interface IHullUserClaims {
    id: string;
    email: string;
    external_id: string;
    anonymous_id: string;
}

export default interface IHullUser {
    id: string;
    email: string;
    external_id: string;
    anonymous_ids: string[];
    [propName: string]: HullAttribute;
}