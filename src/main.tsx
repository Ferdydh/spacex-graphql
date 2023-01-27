import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';
import { LocalStorageWrapper, persistCache } from 'apollo3-cache-persist';

export const cache = new InMemoryCache({
});

// await before instantiating ApolloClient, else queries might run before the cache is persisted
await persistCache({
  cache,
  storage: new LocalStorageWrapper(window.localStorage),
});

const client = new ApolloClient({
  uri: 'https://spacex-production.up.railway.app/', // change to spaceX
  cache: cache,
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
)

