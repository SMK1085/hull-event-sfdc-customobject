import _ from "lodash";
import IPrivateSettings, { IMappingEntry } from "../common/data/private-settings";
import IHullUserUpdateMessage from "../common/data/user-update-message";
import IHullUserEvent from "../common/data/user-event";

class MappingUtil {

    private _connectorSettings: IPrivateSettings;

    constructor(connectorSettings: IPrivateSettings) {
        this._connectorSettings = connectorSettings;
    }

    mapOutgoingData(message: IHullUserUpdateMessage, event: IHullUserEvent): any {
        const sfdcIdentifier = this._connectorSettings.salesforce_customobject_id;
        const hullIdentifier = this._connectorSettings.hull_event_id;
        const referenceMappings = this._connectorSettings.references_outbound;
        const attributeMappings = this._connectorSettings.attributes_outbound;

        if (!sfdcIdentifier || !hullIdentifier) { 
            return undefined;
        }

        const result = {};

        _.forEach(referenceMappings, (r: IMappingEntry) => {
            if (r.salesforce_field_name && r.hull_field_name) {
                _.set(result, r.salesforce_field_name, _.get(message, r.hull_field_name, null));
            }
        });

        _.forEach(attributeMappings, (m: IMappingEntry) => {
            if (m.salesforce_field_name && m.hull_field_name) {
                _.set(result, m.salesforce_field_name, _.get(event, m.hull_field_name, null));
            }
        });

        _.set(result, sfdcIdentifier, _.get(event, hullIdentifier, null));

        return result;
    }
}

export default MappingUtil;