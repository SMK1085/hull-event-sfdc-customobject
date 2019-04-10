import _ from "lodash";
import IPrivateSettings, { IMappingEntry } from "../common/data/private-settings";
import IHullUserUpdateMessage from "../common/data/user-update-message";
import IHullUserEvent from "../common/data/user-event";
import { Record } from "jsforce";

class FilterUtil {
    private _whitelistedEvent: string | undefined;
    private _referenceMappings: IMappingEntry[];
    private _whitelistedEvents: string[] | undefined;

    constructor(privateSettings: IPrivateSettings) {
        this._whitelistedEvent = privateSettings.hull_event;
        this._referenceMappings = privateSettings.references_outbound;
        this._whitelistedEvents = privateSettings.hull_events;
    }
    
    public filterMessagesWithEvent(messages: IHullUserUpdateMessage[]): IHullUserUpdateMessage[] {
        const filteredMessages = _.filter(messages, (m: IHullUserUpdateMessage) => {
            if (m.events.length === 0) {
                return false;
            }

            if (this._whitelistedEvents !== undefined) {
                return _.some(m.events, (e: IHullUserEvent) => _.includes(this._whitelistedEvents, e.event));
            } else {
                return _.some(m.events, (e: IHullUserEvent) => e.event === this._whitelistedEvent);
            }
        });

        return filteredMessages;
    }

    public filterObjectsWithoutReference(records: Record[]): Record[] {
        const result: Record[] = [];

        // Filtering logic goes here
        // Basically check if there are any mappings, and if so, filter them
        if (this._referenceMappings.length !== 0) {
            const sfdcRefMappings = this._referenceMappings.map(m => m.salesforce_field_name);
            _.forEach(records, (r) => {
                const refObj = _.pick(r, _.filter(sfdcRefMappings, (m) => m !== undefined ) as string[]);
                if (_.values(refObj).length > 0) {
                    result.push(r);
                }
            });
        }

        return result;
    }
}

export default FilterUtil;