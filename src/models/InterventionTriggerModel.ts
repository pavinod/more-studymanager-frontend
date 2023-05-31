export interface InterventionTriggerConfig {
  observationId: number | undefined;
  observationType: string;
  observationProperty: string;
  operator: string;
  propertyValue: string | number;
  editMode?: boolean;
  error?: boolean;
}

export interface InterventionTriggerUpdateItem {
  edit?: boolean;
  groupIndex: number;
  rowIndex: number;
  data?: InterventionTriggerConfig;
}
export interface InterventionTriggerUpdateData {
  data: InterventionTriggerConfig;
  groupIndex: number;
  rowIndex: number;
}

export interface TriggerConditionGroup {
  nextGroupCondition: string | null;
  parameter: Array<InterventionTriggerConfig>;
}

export interface GroupConditionChange {
  groupIndex: number;
  value: string;
}

export interface InterventionChoice {
  label: string;
  value: string | number;
}

export interface PushNotificationObject {
  title: string;
  message: string;
}
