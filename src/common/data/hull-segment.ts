import { HullSegmentType } from "./common-types";

export default interface IHullSegment {
    id: string;
    name: string;
    type: HullSegmentType,
    stats: {
        users?: number,
        accounts?: number
    };
    created_at: string;
    updated_at: string;
}