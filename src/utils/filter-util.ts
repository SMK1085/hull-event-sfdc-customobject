import _ from "lodash";
import IPrivateSettings, { IMappingEntry } from "../common/data/private-settings";
import IHullUserUpdateMessage from "../common/data/user-update-message";
import IHullUserEvent from "../common/data/user-event";
import { Record } from "jsforce";

class FilterUtil {
    private _whitelistedEvent: string | undefined;
    private _referenceMappings: IMappingEntry[];

    constructor(privateSettings: IPrivateSettings) {
        this._whitelistedEvent = privateSettings.hull_event;
        this._referenceMappings = privateSettings.references_outbound;
    }
    
    public filterMessagesWithEvent(messages: IHullUserUpdateMessage[]): IHullUserUpdateMessage[] {
        const filteredMessages = _.filter(messages, (m: IHullUserUpdateMessage) => {
            if (m.events.length === 0) {
                return false;
            }
            return _.some(m.events, (e: IHullUserEvent) => e.event === this._whitelistedEvent);
        });

        return filteredMessages;
    }

    public filterObjectsWithoutReference(records: Record[]): Record[] {
        let result: Record[] = [];

        // Filtering logic goes here
        // Basically check if there are any mappings, and if so, filter them
        if (this._referenceMappings.length === 0) {
            result = records; // Pass through if no mappings
        }

        return result;
    }
}

export default FilterUtil;