import IHullUserEvent from "../common/data/user-event";
import IHullClient from "../common/data/hull-client";
import _ from "lodash";

class EventSearchUtil {
 
    private _hullClient: IHullClient;

    constructor(hullClient: IHullClient) {
        this._hullClient = hullClient;
    }

    public async fetchLatestEvents(userId: string, eventName: string): Promise<IHullUserEvent[]> {
        const params = {
            "page":0,
            "per_page":100,
            "raw":true,
            "sort":{
              "created_at":"desc"
            },"query":{
              "bool":{
                "should":[
                  {"term":{
                    "_parent":userId
                  }}
                ],
                "minimum_should_match":1,
                "filter":[{"terms":{"event":[eventName]}}]
                }
            }
        };

        const response = await this._hullClient.post("search/events", params);
        const result = _.map(response.data, (raw: any) => {
            return this._transformRawEvent(raw);
        });

        return Promise.resolve(_.filter(result, (e: IHullUserEvent | undefined) => {
            return e !== undefined;
        }) as IHullUserEvent[]);
    }

    private _transformRawEvent(rawData: any): IHullUserEvent | undefined {
        if (!rawData) {
            return undefined;
        }
        const evtObj = _.pick(rawData, ["indexed_at", "created_at", "event", "source", "session_id", "type", "context"]);
        const result = Object.assign({ id: _.get(rawData, "_id"), properties: {} }, evtObj);

        if (!rawData.props) {
            return result;
        }

        // Transform props
        _.forEach(rawData.props, prop => {
            if (_.has(prop, "date_value")) {
              _.set(result, `properties.${prop.field_name}`, _.get(prop, "date_value", null));
            } else if (_.has(prop, "num_value")) {
              _.set(result, `properties.${prop.field_name}`, _.get(prop, "num_value", 0));
            } else if (_.has(prop, "bool_value")) {
              _.set(result, `properties.${prop.field_name}`, _.get(prop, "bool_value", null));
            } else {
              _.set(result, `properties.${prop.field_name}`, _.get(prop, "text_value", ""));
            }
        });

        return result;
    }
}

export default EventSearchUtil;