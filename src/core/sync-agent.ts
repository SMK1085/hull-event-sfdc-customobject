import { ConnectionOptions, FileProperties, Field } from "jsforce";
import _ from "lodash";
import IHullClient from "../common/data/hull-client";
import SalesforceClient from "./sfdc-client";
import IPrivateSettings from "../common/data/private-settings";
import { SFDC_API_VERSION } from "../common/config";

class SyncAgent {
    private _hullClient: IHullClient;
    private _metricsClient: any;
    private _connector: any;
    private _sfdcClient: SalesforceClient;

    constructor(client: IHullClient, connector: any, metricsClient: any) {
        this._hullClient = client;
        this._metricsClient = metricsClient;
        this._connector = connector;

        const privateSettings: IPrivateSettings = _.get(connector, "private_settings") as IPrivateSettings;
        const connOpts: ConnectionOptions = {
            accessToken: privateSettings.access_token,
            instanceUrl: privateSettings.instance_url,
            oauth2: {
                clientId: privateSettings.client_id,
                clientSecret: privateSettings.client_secret
            },
            refreshToken: privateSettings.refresh_token,
            version: SFDC_API_VERSION
        };
        this._sfdcClient = new SalesforceClient(connOpts, this._hullClient);
    }

    public listCustomObjects(): Promise<FileProperties[]> {
        return this._sfdcClient.listCustomObjects();
    }

    public listFieldsUnique(type: string): Promise<Field[]> {
        return this._sfdcClient.listUniqueFields(type);
    }

    public listFieldsReference(type: string): Promise<Field[]> {
        return this._sfdcClient.listUpdateableReferenceFields(type);
    }

    public listFieldsUpdateable(type: string): Promise<Field[]> {
        return this._sfdcClient.listUpdateableFields(type);
    }
}

export default SyncAgent;