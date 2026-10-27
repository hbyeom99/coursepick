// Only course drafts may take precedence from local guest storage.
// Nullable member fields must prefer the server snapshot, even when null is valid.
export function initialMemberValue({isDraft,local,stored,initial,valid}){
 return isDraft&&valid(local)?local:valid(stored)?stored:initial;
}
