import _ from "lodash";
import moment from "moment";
import IPrivateSettings, { IMappingEntry } from "../common/data/private-settings";
import IHullUserUpdateMessage from "../common/data/user-update-message";
import IHullUserEvent from "../common/data/user-event";
import { Record } from "jsforce";

class MappingUtil {

    private _connectorSettings: IPrivateSettings;

    constructor(connectorSettings: IPrivateSettings) {
        this._connectorSettings = connectorSettings;
    }

    public mapOutgoingData(message: IHullUserUpdateMessage, event: IHullUserEvent): Record {
        const sfdcIdentifier = this._connectorSettings.salesforce_customobject_id;
        const hullIdentifier = this._connectorSettings.hull_event_id;
        const referenceMappings = this._connectorSettings.references_outbound;
        const attributeMappings = this._connectorSettings.attributes_outbound;

        if (!sfdcIdentifier || !hullIdentifier) { 
            return undefined;
        }

        if (hullIdentifier === "id") { // It's labeled differently on non-batch operations
            if (_.get(event, hullIdentifier, _.get(event, "event_id", null)) === null) {
                return undefined;
            }    
        } else {
            if (_.get(event, hullIdentifier, null) === null) {
                return undefined;
            }
        }

        const result = {};

        _.forEach(referenceMappings, (r: IMappingEntry) => {
            if (r.salesforce_field_name && r.hull_field_name && _.get(message.user, r.hull_field_name, null) !== null) {
                _.set(result, r.salesforce_field_name, _.get(message.user, r.hull_field_name, null));
            }
        });

        _.forEach(attributeMappings, (m: IMappingEntry) => {
            if (m.salesforce_field_name && m.hull_field_name && _.get(event, m.hull_field_name, null) !== null) {
                if (m.hull_field_name.startsWith("user.")) {
                    _.set(result, m.salesforce_field_name, _.get(message.user, m.hull_field_name.replace("user.", ""), null));
                } else if(m.hull_field_name.startsWith("account.")) {
                    _.set(result, m.salesforce_field_name, _.get(message.account, m.hull_field_name.replace("account.", ""), null));
                } else if (m.hull_field_name === "created_at") {
                    _.set(result, m.salesforce_field_name, moment(_.get(event, m.hull_field_name as string, null)).toISOString());
                } else {
                    if(_.isString(_.get(event, m.hull_field_name, null))) {
                        if(_.get(event, m.hull_field_name, "").length > 255) {
                            _.set(result, m.salesforce_field_name, _.get(event, m.hull_field_name, "").substr(0, 255));
                        } else {
                            _.set(result, m.salesforce_field_name, _.get(event, m.hull_field_name, null));
                        }
                    } else {
                        _.set(result, m.salesforce_field_name, _.get(event, m.hull_field_name, null));
                    }
                }
                
            }
        });

        if (hullIdentifier === "id") {
            _.set(result, sfdcIdentifier, _.get(event, hullIdentifier, _.get(event, "event_id", null)));
        } else {
            _.set(result, sfdcIdentifier, _.get(event, hullIdentifier, null));
        }

        // tslint:disable-next-line:no-console
        console.log("Resulting SFDC object", result);

        return result;
    }
}

export default MappingUtil;