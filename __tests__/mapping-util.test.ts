import MappingUtil from "../src/utils/mapping-util";
import userUpdateMessage from "./data/user-update-message.json";
import IPrivateSettings from "../src/common/data/private-settings";
import IHullUserUpdateMessage from "../src/common/data/user-update-message";
import IHullUserEvent from "../src/common/data/user-event";
import _ from "lodash";

describe("MappingUtil", () => {
    test("should map outgoing data if valid", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        const util = new MappingUtil(privateSettings);
        const msg: IHullUserUpdateMessage = _.cloneDeep(userUpdateMessage.messages[0]) as any;
        const event: IHullUserEvent = msg.events[0];
        const actual = util.mapOutgoingData(msg, event);
        const expected = {
            Hull_Session_ID__c: "1548854832-e1d8a7e1-267c-47cf-a046-34b180b75c5d",
            Session_Start_Time__c: "2019-01-30T13:27:12.000Z",
            initial_url__c: "https://www.testdrivehull.io/en-US",
            referrer__c: "https://testdrivehull.io/signup",
        };
        expect(actual).toEqual(expected);
    });

    test("should map outgoing data if hull id not event_id", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        privateSettings.hull_event_id = "track_id";
        const util = new MappingUtil(privateSettings);
        const msg: IHullUserUpdateMessage = _.cloneDeep(userUpdateMessage.messages[0]) as any;
        const event: IHullUserEvent = msg.events[0];
        const actual = util.mapOutgoingData(msg, event);
        const expected = {
            Hull_Session_ID__c: "5c51a69f9c9dd4609d042b35",
            Session_Start_Time__c: "2019-01-30T13:27:12.000Z",
            initial_url__c: "https://www.testdrivehull.io/en-US",
            referrer__c: "https://testdrivehull.io/signup",
        };
        expect(actual).toEqual(expected);
    });

    test("should map outgoing data and ignore incomplete mappings", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        privateSettings.references_outbound.push({ hull_field_name: "baz", salesforce_field_name: undefined });
        privateSettings.attributes_outbound.push( { hull_field_name: "foo", salesforce_field_name: undefined });
        const util = new MappingUtil(privateSettings);
        const msg: IHullUserUpdateMessage = _.cloneDeep(userUpdateMessage.messages[0]) as any;
        const event: IHullUserEvent = msg.events[0];
        const actual = util.mapOutgoingData(msg, event);
        const expected = {
            Hull_Session_ID__c: "1548854832-e1d8a7e1-267c-47cf-a046-34b180b75c5d",
            Session_Start_Time__c: "2019-01-30T13:27:12.000Z",
            initial_url__c: "https://www.testdrivehull.io/en-US",
            referrer__c: "https://testdrivehull.io/signup",
        };
        expect(actual).toEqual(expected);
    });

    test("should return undefined if the unique identifier is not present", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        privateSettings.hull_event_id = "foo";
        const util = new MappingUtil(privateSettings);
        const msg: IHullUserUpdateMessage = _.cloneDeep(userUpdateMessage.messages[0]) as any;
        const event: IHullUserEvent = msg.events[0];
        const actual = util.mapOutgoingData(msg, event);
        expect(actual).toBeUndefined();
    });

    test("should return undefined if the unique identifier has a null value", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        const util = new MappingUtil(privateSettings);
        const msg: IHullUserUpdateMessage = _.cloneDeep(userUpdateMessage.messages[0]) as any;
        const event: IHullUserEvent = msg.events[0];
        _.unset(event, "id");
        _.unset(event, "event_id");
        const actual = util.mapOutgoingData(msg, event);
        expect(actual).toBeUndefined();
    });

    test("should return undefined if the hull identifier is not configured", () => {
        const privateSettings: IPrivateSettings = _.cloneDeep(userUpdateMessage.connector.private_settings);
        privateSettings.hull_event_id = undefined;
        const util = new MappingUtil(privateSettings);
        const msg: IHullUserUpdateMessage = _.cloneDeep(userUpdateMessage.messages[0]) as any;
        const event: IHullUserEvent = msg.events[0];
        const actual = util.mapOutgoingData(msg, event);
        expect(actual).toBeUndefined();
    });
});