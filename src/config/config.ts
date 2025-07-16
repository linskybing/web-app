import dotenv from 'dotenv';
dotenv.config();

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  port: process.env.PORT || 3000,
};

export const registryConfig = {
  registry: "master.harbor.registry"
};

export const hostConfig = {
  host: "10.121.124.21"
};

// export const LDAP_URL = process.env.LDAP_URL || 'ldap://localhost:389';
// export const LDAP_BASE_DN = process.env.LDAP_BASE_DN || 'dc=nthu,dc=edu,dc=tw';