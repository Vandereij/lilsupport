export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  qr_code_url: string | null;
  stripe_account_id: string | null;
};