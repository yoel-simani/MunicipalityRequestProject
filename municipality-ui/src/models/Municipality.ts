export interface Nose {
  noseId: string;
  shemNose: string;
  teur?: string;
}

export interface TatNose {
  noseId: string;
  noseAv: number;
  shemNose: string;
  teur?: string;
}

export interface SugPniya {
  nose: string;
  tatNose: string;
  sugPniya: string;
  teurSugPniya: string;
  pattern: number;
  explanation?: string;
  statmentTitle?: string;
  statmentBody?: string;
  koteretMeshalem?: string;
  koteretPhizi?: string;
  noseBilling?: string;
  sugPniyaB?: string;
}

export interface AppDataResponse {
  noseimList: Nose[];
  TateyNoseimList: TatNose[];
  sugeyPniyotList: SugPniya[];
}

export interface ApiResponse {
  appDataResponse: AppDataResponse;
}
