import { Client, Account } from 'appwrite';

const client = new Client()
  .setEndpoint('http://localhost/v1') // nebo URL tvého Appwrite serveru
  .setProject('6ad8a52c00186563c091');

export const account = new Account(client);