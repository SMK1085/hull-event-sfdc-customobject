export interface IMappingEntry {
    hull_field_name: string | undefined;
    salesforce_field_name: string | undefined;
}

export default interface IPrivateSettings {
    refresh_token: string | undefined;
    access_token: string | undefined;
    instance_url: string | undefined;
    client_id: string | undefined;
    client_secret: string | undefined;
    hull_event: string | undefined;
    salesforce_customobject: string | undefined;
    hull_event_id: string | undefined;
    salesforce_customobject_id: string | undefined;
    references_outbound: IMappingEntry[];
    attributes_outbound: IMappingEntry[];
    salesforce_oauth_url: string;
}