export type HealthStatus = 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';

export interface HealthComponentStatus {
  status: HealthStatus;
}

export interface HealthResponse {
  status: HealthStatus;
  groups?: string[];
  components?: Record<string, HealthComponentStatus>;
}

export interface ServerInfo {
  build?: {
    version?: string;
    artifact?: string;
    name?: string;
    time?: string;
    group?: string;
    git?: {
      commit?: string;
    };
  };
}
