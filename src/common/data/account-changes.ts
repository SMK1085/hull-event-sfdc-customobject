import IHullAttributeChanges from "./attribute-changes";
import { IHullSegmentChanges } from "./hull-segment-changes";

export default interface IHullAccountChanges {
    account: IHullAttributeChanges;
    segments: IHullSegmentChanges;
}