import FilterUtil from "../src/utils/filter-util";
import userUpdateMessage from "./data/user-update-message.json";
import IPrivateSettings from "../src/common/data/private-settings";
import IHullUserUpdateMessage from "../src/common/data/user-update-message";
import _ from "lodash";
import MappingUtil from "../src/utils/mapping-util";

describe("FilterUtil", () => {
    test("should filter events in messages that match the whitelisted event", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        const util = new FilterUtil(privateSettings);
        const messages: IHullUserUpdateMessage[] = _.cloneDeep(userUpdateMessage.messages) as any[];
        const actual =  util.filterMessagesWithEvent(messages);
        const expected = messages;
        expect(actual).toEqual(expected);
    });

    test("should exclude messages without the whitelisted event", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        const util = new FilterUtil(privateSettings);
        const messages: IHullUserUpdateMessage[] = _.cloneDeep(userUpdateMessage.messages) as any[];
        const messagesWithExcludedEvent = _.cloneDeep(messages);
        const msgExcludedEvent = _.cloneDeep(messages[0]);
        msgExcludedEvent.events = [ { 
            event: "page", 
            context: { 
                ip: 0, 
                page: { 
                    referrer: "https://www.google.com"
                },
             },
             created_at: new Date().toISOString(),
             event_id: "1234",
             properties: {
                 url: "https://www.testdrive.hull.io/test",
                 title: "Test | Hull Testdrive"
             }
        }];
        messagesWithExcludedEvent.push(msgExcludedEvent)
        const actual =  util.filterMessagesWithEvent(messagesWithExcludedEvent);
        const expected = messages;
        expect(actual).toEqual(expected);
    });

    test("should filter events that match the any of the whitelisted events", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        privateSettings.hull_events = [privateSettings.hull_event, "foo"] as string[];
        privateSettings.hull_event = undefined;
        const util = new FilterUtil(privateSettings);
        const messages: IHullUserUpdateMessage[] = _.cloneDeep(userUpdateMessage.messages) as any[];
        const actual =  util.filterMessagesWithEvent(messages);
        const expected = messages;
        expect(actual).toEqual(expected);
    });

    test("should not fail if messages don't have any events", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        const util = new FilterUtil(privateSettings);
        const messages: IHullUserUpdateMessage[] = _.cloneDeep(userUpdateMessage.messages) as any[];
        messages[0].events= [];
        messages[1].events= [];
        const actual =  util.filterMessagesWithEvent(messages);
        const expected: IHullUserUpdateMessage[] = [];
        expect(actual).toEqual(expected);
    });

    test("should filter out mapped SFDC objects without any reference values", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        privateSettings.skip_objects_with_no_reference = true;
        const util = new FilterUtil(privateSettings);
        const mapUtil = new MappingUtil(privateSettings);
        const messages: IHullUserUpdateMessage[] = _.cloneDeep(userUpdateMessage.messages) as any[];
        const sfdcRecords: any[] = [];
        _.forEach(messages, (m) => {
            _.forEach(m.events, e => {
                const sfdcRec = mapUtil.mapOutgoingData(m, e);
                sfdcRecords.push(sfdcRec);
            });
        });
        const actual =  util.filterObjectsWithoutReference(sfdcRecords);
        const expected: any[] = [];
        expect(actual).toEqual(expected);
    });

    test("should not filter out mapped SFDC objects with at least one reference values", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        privateSettings.skip_objects_with_no_reference = true;
        const util = new FilterUtil(privateSettings);
        const mapUtil = new MappingUtil(privateSettings);
        const messages: IHullUserUpdateMessage[] = _.cloneDeep(userUpdateMessage.messages) as any[];
        _.forEach(messages, m => {
            _.set(m, "user.traits_salesforce_lead/id", "72talnshYuxiV");
        });
        const sfdcRecords: any[] = [];
        _.forEach(messages, (m) => {
            _.forEach(m.events, e => {
                const sfdcRec = mapUtil.mapOutgoingData(m, e);
                sfdcRecords.push(sfdcRec);
            });
        });
        const actual =  util.filterObjectsWithoutReference(sfdcRecords);
        const expected = sfdcRecords;
        expect(actual).toEqual(expected);
    });


});
