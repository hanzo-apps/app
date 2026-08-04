export interface User {
  fullname: string;
  avatarUrl: string;
  name: string;
  /** Two-letter monogram for the avatar placeholder — never derived per surface. */
  initials: string;
  email?: string;
  username?: string;
  isLocalUse?: boolean;
  isPro: boolean;
  id: string;
  token?: string;
}

export interface HtmlHistory {
  pages: Page[];
  createdAt: Date;
  prompt: string;
}

export interface Project {
  title: string;
  html: string;
  prompts: string[];
  user_id: string;
  space_id: string;
  /**
   * The linked repository, when the project HAS one. Recorded server-side by
   * `/v1/git/sync` (PATCH `repo:{url,branch}`) and read by the console + history
   * panel. Optional because most projects have no repo at all — modelling it as
   * always-present is what let the status bar state a branch for a project that
   * was never version-controlled.
   */
  repo?: { url: string; branch?: string };
  _id?: string;
  _updatedAt?: Date;
  _createdAt?: Date;
}

export interface Page {
  path: string;
  html: string;
}
