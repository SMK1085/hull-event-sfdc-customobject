import { 
    Connection, 
    ConnectionOptions, 
    FileProperties, 
    DescribeSObjectResult, 
    Field, 
    Record,
    RecordResult 
} from "jsforce";
import _ from "lodash";
import IHullClient from "../common/data/hull-client";
import { SFDC_API_VERSION } from "../common/config";

class SalesforceClient {
    private _connection: Connection;

    constructor(connectionOptions: ConnectionOptions, hullClient: IHullClient) {
        this._connection = new Connection(connectionOptions);
        this._connection.on("refresh", (accessToken: string, res: any) => {
            hullClient.logger.debug("connector.sfdcClient.refresh", { accessToken, res });
            hullClient.utils.settings.update({ access_token: accessToken });
        });
    }

    public async listCustomObjects(): Promise<FileProperties[]> {
        const types = [{ type: "CustomObject", folder: undefined }];
        return this._connection.metadata.list(types, SFDC_API_VERSION);
    }

    public async listUpdateableFields(type: string): Promise<Field[]> {
        return this._connection.describe(type)
            .then((meta: DescribeSObjectResult) => {
                return _.filter(meta.fields, { updateable: true });
            });
    }

    public async listUniqueFields(type: string): Promise<Field[]> {
        return this._connection.describe(type)
            .then((meta: DescribeSObjectResult) => {
                return _.filter(meta.fields, { unique: true });
            });
    }

    public async listUpdateableReferenceFields(type: string): Promise<Field[]> {
        return this._connection.describe(type)
            .then((meta: DescribeSObjectResult) => {
                return _.filter(meta.fields, { updateable: true, type: "reference" });
            });
    }

    public async queryExistingRecords(type: string, sfdcId: string, recordIds: string[]): Promise<Record[]> {
        const params = {};
        _.set(params, sfdcId, { $in: recordIds });
        return this._connection.sobject(type)
            .find(params);
    }

    public async createRecords(type: string, records: Record[]): Promise<RecordResult[] | undefined> {
        return new Promise((resolve, reject) => {
            this._connection.sobject(type)
                .create(
                    records, 
                    { allOrNone: true } as any,
                    (err: Error | null, results?: RecordResult[] | undefined) => {
                        if (err) {
                            return reject(err);
                        }

                        if (!results) {
                            return resolve([]);
                        }

                        return resolve(results);
                    }
                );
        });
    }

    public async updateRecords(type: string, records: Record[]): Promise<RecordResult[] | undefined> {
        return new Promise((resolve, reject) => {
            this._connection.sobject(type)
                .update(
                    records, 
                    { allOrNone: true } as any,
                    (err: Error | null, results?: RecordResult[] | undefined) => {
                        if (err) {
                            return reject(err);
                        }

                        if (!results) {
                            return resolve([]);
                        }

                        return resolve(results);
                    }
                );
        });
    }
}

export default SalesforceClient;