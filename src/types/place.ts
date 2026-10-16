export interface Place {
  id: string;
  name: string;
  category: string;
  region: string;
  location: string;
  description: string;
  tags: string[];
  imageUrl: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  /** 0 means unrated; positive values represent a score out of 5. */
  rating: number;
  lodgingInfo?: { checkIn: string; checkOut: string; contact: string; source: string; imageLicense: string; businessType?: string; sourceUpdatedAt?: string };
  /** Only explicitly verified booleans qualify for companion filters. */
  companionInfo?: { infantAllowed?: boolean; infantStatus?: string; infantFacilities?: Record<string,string>; infantSource?: string; infantSourceUpdatedAt?: string; petAllowed?: boolean; petStatus?: string; petDedicated?: string; petSize?: string; petRestrictions?: string; petExtraFee?: string; source?: string; sourceUpdatedAt?: string };
}
