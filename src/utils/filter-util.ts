import _ from "lodash";
import IPrivateSettings from "../common/data/private-settings";
import IHullUserUpdateMessage from "../common/data/user-update-message";
import IHullUserEvent from "../common/data/user-event";

class FilterUtil {
    private _whitelistedEvent: string | undefined;

    constructor(privateSettings: IPrivateSettings) {
        this._whitelistedEvent = privateSettings.hull_event;
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
}

export default FilterUtil;