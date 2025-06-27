import ldap from 'ldapjs';
import { LDAP_URL } from '../config/config';

export async function ldapAuthenticate(userDN: string, password: string): Promise<boolean> {
  return new Promise((resolve) => {
    const client = ldap.createClient({ url: LDAP_URL });
    client.bind(userDN, password, (err: Error | null) => {
      client.unbind();
      resolve(!err);
    });
  });
}