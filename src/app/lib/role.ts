export const roles = ['user', 'admin', 'superadmin'] as const;
export type Role = (typeof roles)[number];
