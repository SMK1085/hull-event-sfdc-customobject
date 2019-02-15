import { ConnectionOptions, FileProperties, Field, Record, RecordResult, SuccessResult, ErrorResult } from "jsforce";
import _ from "lodash";
import Bluebird from "bluebird";
import IHullClient from "../common/data/hull-client";
import SalesforceClient from "./sfdc-client";
import IPrivateSettings from "../common/data/private-settings";
import { SFDC_API_VERSION } from "../common/config";
import IHullUserUpdateMessage from "../common/data/user-update-message";
import FilterUtil from "../utils/filter-util";
import MappingUtil from "../utils/mapping-util";
import EventSearchUtil from "../utils/event-search-util";

class SyncAgent {
    private _hullClient: IHullClient;
    private _metricsClient: any;
    private _connector: any;
    private _sfdcClient: SalesforceClient;
    private _filterUtil: FilterUtil;
    private _mappingUtil: MappingUtil;
    private _eventSearchUtil: EventSearchUtil;

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

        this._filterUtil = new FilterUtil(privateSettings);
        this._mappingUtil = new MappingUtil(privateSettings);
        this._eventSearchUtil = new EventSearchUtil(this._hullClient);
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

    public async sendUserMessages(messages: IHullUserUpdateMessage[], isBatch: boolean = false): Promise<any> {
        // Do some pre-flight checks to determine whether we can process anything at all or not
        const privateSettings: IPrivateSettings = _.get(this._connector, "private_settings") as IPrivateSettings;
        if (!privateSettings.access_token || privateSettings.access_token.trim().length === 0 ||
            !privateSettings.client_id || privateSettings.client_id.trim().length === 0 ||
            !privateSettings.client_secret || privateSettings.client_secret.trim().length === 0 ||
            !privateSettings.hull_event || privateSettings.hull_event.trim().length === 0 ||
            !privateSettings.hull_event_id || privateSettings.hull_event_id.trim().length === 0 ||
            !privateSettings.instance_url || privateSettings.instance_url.trim().length === 0 ||
            !privateSettings.salesforce_customobject || privateSettings.salesforce_customobject.trim().length === 0 ||
            !privateSettings.salesforce_customobject_id || privateSettings.salesforce_customobject_id.trim().length === 0) {
            // The connector is not in an operational state,
            // so return immediately
            return Promise.resolve();
        }
        
        const filteredMessages = isBatch ? messages : this._filterUtil.filterMessagesWithEvent(messages);
        // Don't waste any processing time, if all messages don't have the event,
        // just return right away, no need to pollute the logs since the connector
        // docs explicitely state that we only process the whitelisted event
        if (!filteredMessages || filteredMessages.length === 0) {
            return Promise.resolve();
        }

        await Bluebird.map(messages, async (msg: IHullUserUpdateMessage) => {
            if(isBatch) {
                const events = await this._eventSearchUtil.fetchLatestEvents(msg.user.id, privateSettings.hull_event as string);
                let sfdcObjects: Record[] = _.map(events, (e) => this._mappingUtil.mapOutgoingData(msg, e));
                sfdcObjects = _.filter(sfdcObjects, (o: Record | undefined) => o !== undefined);

                const existingObjects = await this._sfdcClient.queryExistingRecords(
                    privateSettings.salesforce_customobject as string,
                    privateSettings.salesforce_customobject_id as string,
                    _.map(sfdcObjects, (o) => _.get(o, privateSettings.salesforce_customobject_id as string)) as string[]
                );

                const objectsToCreate = _.filter(sfdcObjects, (o) => {
                    return _.findIndex(existingObjects, (eo) => {
                        return _.get(eo, privateSettings.salesforce_customobject_id as string) === 
                            _.get(o, privateSettings.salesforce_customobject_id as string); 
                    }) === -1;
                });
                const objectsToUpdate = _.filter(sfdcObjects, (o) => {
                    return _.findIndex(existingObjects, (eo) => {
                        return _.get(eo, privateSettings.salesforce_customobject_id as string) === 
                            _.get(o, privateSettings.salesforce_customobject_id as string);
                    }) !== -1;
                });

                // Attach the Id for records to update, otherwise SFDC will fail
                _.forEach(objectsToUpdate, (o) => {
                    _.set(o, "Id", _.find(existingObjects, (eo) => {
                        return _.get(eo, privateSettings.salesforce_customobject_id as string) === 
                            _.get(o, privateSettings.salesforce_customobject_id as string);
                    }).Id);
                });

                const createdRecords = await this._sfdcClient.createRecords(
                    privateSettings.salesforce_customobject as string,
                    objectsToCreate
                );

                const updatedRecords = await this._sfdcClient.updateRecords(
                    privateSettings.salesforce_customobject as string,
                    objectsToUpdate
                );
                
                if (createdRecords && updatedRecords) {
                    const changedRecords = _.concat(createdRecords, updatedRecords);
                    const errors = _.filter(changedRecords, (r: RecordResult) => {
                        return r.success === false;
                    });
                    if (errors.length > 0) {
                        await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                            .logger.error("outgoing.event.error", { changedRecords });
                    } else {
                        await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                            .logger.log("outgoing.event.success", { changedRecords });
                    }
                } else if (createdRecords) {
                    const errors = _.filter(createdRecords, (r: RecordResult) => {
                        return r.success === false;
                    });
                    if (errors.length > 0) {
                        await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                            .logger.error("outgoing.event.error", { changedRecords: createdRecords });
                    } else {
                        await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                            .logger.log("outgoing.event.success", { changedRecords: createdRecords });
                    }
                } else if (updatedRecords) {
                    const errors = _.filter(updatedRecords, (r: RecordResult) => {
                        return r.success === false;
                    });
                    if (errors.length > 0) {
                        await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                            .logger.error("outgoing.event.error", { changedRecords: updatedRecords });
                    } else {
                        await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                            .logger.log("outgoing.event.success", { changedRecords: updatedRecords });
                    }
                }
            } else {
                const events = _.filter(msg.events, (e) => {
                    if (!e) {
                        return false;
                    }
                    return e.event === privateSettings.hull_event; 
                });
                if (events.length > 0) {

                    let sfdcObjects: Record[] = _.map(events, (e) => this._mappingUtil.mapOutgoingData(msg, e));

                    sfdcObjects = _.filter(sfdcObjects, (o: Record | undefined) => o !== undefined);

                    const existingObjects = await this._sfdcClient.queryExistingRecords(
                        privateSettings.salesforce_customobject as string,
                        privateSettings.salesforce_customobject_id as string,
                        _.map(sfdcObjects, (o) => _.get(o, privateSettings.salesforce_customobject_id as string)) as string[]
                    );

                    const objectsToCreate = _.filter(sfdcObjects, (o) => {
                        return _.findIndex(existingObjects, (eo) => {
                            return _.get(eo, privateSettings.salesforce_customobject_id as string) === 
                                _.get(o, privateSettings.salesforce_customobject_id as string); 
                        }) === -1;
                    });
                    const objectsToUpdate = _.filter(sfdcObjects, (o) => {
                        return _.findIndex(existingObjects, (eo) => {
                            return _.get(eo, privateSettings.salesforce_customobject_id as string) === 
                                _.get(o, privateSettings.salesforce_customobject_id as string);
                        }) !== -1;
                    });

                    // Attach the Id for records to update, otherwise SFDC will fail
                    _.forEach(objectsToUpdate, (o) => {
                        _.set(o, "Id", _.find(existingObjects, (eo) => {
                            return _.get(eo, privateSettings.salesforce_customobject_id as string) === 
                                _.get(o, privateSettings.salesforce_customobject_id as string);
                        }).Id);
                    }); 

                    const createdRecords = await this._sfdcClient.createRecords(
                        privateSettings.salesforce_customobject as string,
                        objectsToCreate
                    );

                    const updatedRecords = await this._sfdcClient.updateRecords(
                        privateSettings.salesforce_customobject as string,
                        objectsToUpdate
                    );
                    
                    if (createdRecords && updatedRecords) {
                        const changedRecords = _.concat(createdRecords, updatedRecords);
                        const errors = _.filter(changedRecords, (r: RecordResult) => {
                            return r.success === false;
                        });
                        if (errors.length > 0) {
                            await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                                .logger.error("outgoing.event.error", { changedRecords });
                        } else {
                            await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                                .logger.log("outgoing.event.success", { changedRecords });
                        }
                    } else if (createdRecords) {
                        const errors = _.filter(createdRecords, (r: RecordResult) => {
                            return r.success === false;
                        });
                        if (errors.length > 0) {
                            await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                                .logger.error("outgoing.event.error", { changedRecords: createdRecords });
                        } else {
                            await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                                .logger.log("outgoing.event.success", { changedRecords: createdRecords });
                        }
                    } else if (updatedRecords) {
                        const errors = _.filter(updatedRecords, (r: RecordResult) => {
                            return r.success === false;
                        });
                        if (errors.length > 0) {
                            await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                                .logger.error("outgoing.event.error", { changedRecords: updatedRecords });
                        } else {
                            await this._hullClient.asUser(_.pick(msg.user, ["id", "external_id", "email"]))
                                .logger.log("outgoing.event.success", { changedRecords: updatedRecords });
                        }
                    }
                }
            }
        }, { concurrency: 10 });

        return Promise.resolve();
    }
}

export default SyncAgent;