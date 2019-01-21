import _ from "lodash";
import { Request, Response } from "express";
import IHullClient from "../common/data/hull-client";
import SyncAgent from "../core/sync-agent";
import IPrivateSettings from "../common/data/private-settings";
import { FileProperties } from "jsforce";

const fetchCustomObjects = (req: Request, res: Response) => {
    const client: IHullClient = (req as any).hull.client;
    const connector: any = (req as any).hull.ship;
    const metric: any = (req as any).hull.metric;
    const cache: any = (req as any).hull.cache;
    const agent = new SyncAgent(client, connector, metric);

    const privateSettings = _.get(connector, "private_settings") as IPrivateSettings;
    if (!privateSettings.instance_url ||
        !privateSettings.access_token ||
        !privateSettings.refresh_token ||
        !privateSettings.client_id ||
        !privateSettings.client_secret) {
        return res.json({ 
            ok: false, 
            error: "The connector is not or not properly authenticated with Salesforce.",
            options: []
        });
    }

    return cache.wrap("customObjects", () => {
        return agent.listCustomObjects();
    })
    .then((customObjects: FileProperties[]) => {
        const options = (customObjects || []).map((o: FileProperties) => {
            return { value: o.fullName, label: o.fullName };
        });
        return res.json({ ok: true, options });
    })
    .catch((err: Error) => {
        return res.json({ ok: false, error: err.message, options: []});
    });
}

export default fetchCustomObjects;