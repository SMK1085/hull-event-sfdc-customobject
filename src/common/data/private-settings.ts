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
    hull_event: string | undefined; // Deprecated in v0.1.1, use hull_events instead
    salesforce_customobject: string | undefined;
    hull_event_id: string | undefined;
    salesforce_customobject_id: string | undefined;
    references_outbound: IMappingEntry[];
    attributes_outbound: IMappingEntry[];
    salesforce_oauth_url: string;
    // Added in v0.1.1
    hull_events?: string[];
    synchronized_segments_ignore?: boolean;
    synchronized_segments?: string[];

}