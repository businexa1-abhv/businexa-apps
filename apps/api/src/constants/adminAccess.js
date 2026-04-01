/**
 * Admin staff levels and effective permissions (RBAC within role=admin).
 */

const ADMIN_LEVELS = Object.freeze(['super-admin', 'moderator', 'analyst', 'support']);

/** Default permission sets per level (merged with optional User.adminPermissions overrides). */
function defaultPermissionsForLevel(level) {
  const base = {
    users: { view: false, edit: false, delete: false },
    shops: { view: false, edit: false, delete: false },
    products: { view: false, edit: false, delete: false },
    subscriptions: { view: false, manage: false },
    analytics: false,
    audit: { view: false },
    communications: false,
    settings: false,
    adminManagement: false,
  };

  switch (level) {
    case 'super-admin':
      return {
        users: { view: true, edit: true, delete: true },
        shops: { view: true, edit: true, delete: true },
        products: { view: true, edit: true, delete: true },
        subscriptions: { view: true, manage: true },
        analytics: true,
        audit: { view: true },
        communications: true,
        settings: true,
        adminManagement: true,
      };
    case 'moderator':
      return {
        ...base,
        users: { view: true, edit: true, delete: false },
        shops: { view: true, edit: true, delete: false },
        products: { view: true, edit: true, delete: true },
        subscriptions: { view: true, manage: false },
        analytics: true,
        audit: { view: true },
      };
    case 'analyst':
      return {
        ...base,
        users: { view: true, edit: false, delete: false },
        shops: { view: true, edit: false, delete: false },
        products: { view: true, edit: false, delete: false },
        subscriptions: { view: true, manage: false },
        analytics: true,
      };
    case 'support':
      return {
        ...base,
        users: { view: true, edit: true, delete: false },
        shops: { view: true, edit: false, delete: false },
        subscriptions: { view: true, manage: false },
        communications: true,
      };
    default:
      return defaultPermissionsForLevel('super-admin');
  }
}

function deepMerge(base, over) {
  if (!over || typeof over !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(over)) {
    const v = over[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
      out[k] = deepMerge(base[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Effective permissions for an admin user (defaults for adminLevel + JSON overrides).
 * @param {{ role: string, adminLevel?: string, adminPermissions?: object }} user
 */
function getEffectiveAdminPermissions(user) {
  if (!user || user.role !== 'admin') return null;
  const level = user.adminLevel || 'super-admin';
  const defaults = defaultPermissionsForLevel(level);
  return deepMerge(defaults, user.adminPermissions || {});
}

/**
 * @param {string} area - users | shops | products | subscriptions | analytics | audit | communications | settings | adminManagement
 * @param {string} capability - view | edit | delete | manage (area-specific)
 */
function hasAdminPermission(user, area, capability = 'view') {
  if (!user || user.role !== 'admin') return false;
  const p = getEffectiveAdminPermissions(user);
  if (!p) return false;

  if (area === 'analytics') return p.analytics === true;
  if (area === 'communications') return p.communications === true;
  if (area === 'settings') return p.settings === true;
  if (area === 'adminManagement') return p.adminManagement === true;

  if (area === 'audit') {
    return p.audit?.view === true;
  }

  if (area === 'subscriptions') {
    if (capability === 'manage') return p.subscriptions?.manage === true;
    return p.subscriptions?.view === true;
  }

  const section = p[area];
  if (!section || typeof section !== 'object') return false;
  return section[capability] === true;
}

module.exports = {
  ADMIN_LEVELS,
  defaultPermissionsForLevel,
  getEffectiveAdminPermissions,
  hasAdminPermission,
};
