export interface AccessibilityInfo {
  schemaVersion: number;
  source: string;
  checkedAt: string;
  reviewStatus: string;
  features: Record<string, { status: string; evidence: { raw: string; contentId: string; retrievedAt: string }[] }>;
}
export interface Place {
  traitFacts?: { activityIntensity?: number; participatory?: boolean; reservationRequired?: boolean; costPerPerson?: number; source?: string };
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
  accessibilityInfo?: AccessibilityInfo;
  lodgingInfo?: { checkIn: string; checkOut: string; contact: string; source: string; imageLicense: string; businessType?: string; sourceUpdatedAt?: string };
  /** Only explicitly verified booleans qualify for companion filters. */
  companionInfo?: { infantAllowed?: boolean; infantStatus?: string; infantFacilities?: Record<string,string>; infantSource?: string; infantSourceUpdatedAt?: string; petAllowed?: boolean; petStatus?: string; petDedicated?: string; petSize?: string; petRestrictions?: string; petExtraFee?: string; source?: string; sourceUpdatedAt?: string };
}
