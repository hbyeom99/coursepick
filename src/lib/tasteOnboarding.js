export const TASTE_ONBOARDING_KEY='coursepick.testTaste.v1';
export function needsTasteOnboarding(account){
 return Boolean(account&&!account.isGuest&&account.tasteOnboardingRequired===true&&account.values?.[TASTE_ONBOARDING_KEY]?.completed!==true);
}
