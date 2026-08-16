export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  isNew?: boolean;
}