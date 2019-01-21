import { Connection, ConnectionOptions, FileProperties, DescribeSObjectResult, Field } from "jsforce";
import _ from "lodash";
import IHullClient from "../common/data/hull-client";
import { SFDC_API_VERSION } from "../common/config";

class SalesforceClient {
    _connection: Connection;

    constructor(connectionOptions: ConnectionOptions, hullClient: IHullClient) {
        this._connection = new Connection(connectionOptions);
        this._connection.on("refresh", (accessToken: string, res: any) => {
            hullClient.logger.debug("connector.sfdcClient.refresh", { accessToken, res });
            hullClient.utils.settings.update({ access_token: accessToken });
        });
    }

    async listCustomObjects(): Promise<FileProperties[]> {
        const types = [{ type: "CustomObject", folder: undefined }];
        return this._connection.metadata.list(types, SFDC_API_VERSION);
    }

    async listUpdateableFields(type: string): Promise<Field[]> {
        return this._connection.describe(type)
            .then((meta: DescribeSObjectResult) => {
                return _.filter(meta.fields, { updateable: true });
            });
    }

    async listUniqueFields(type: string): Promise<Field[]> {
        return this._connection.describe(type)
            .then((meta: DescribeSObjectResult) => {
                return _.filter(meta.fields, { unique: true });
            });
    }

    async listUpdateableReferenceFields(type: string): Promise<Field[]> {
        return this._connection.describe(type)
            .then((meta: DescribeSObjectResult) => {
                return _.filter(meta.fields, { updateable: true, type: "reference" });
            });
    }
}

export default SalesforceClient;