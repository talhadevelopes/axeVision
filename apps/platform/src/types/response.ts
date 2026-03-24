import type { Member, WebsiteDTO } from "@axeVision/shared";

export interface ApiResponse {
  members?: Member[];
  member?: Member;
  message?: string;
  error?: string;
  websites?: WebsiteDTO[];
  website?: WebsiteDTO;
}