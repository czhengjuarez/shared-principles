import React from 'react';
import ReactDOM from 'react-dom/client';
import Layout from './components/Layout';
import Home from './pages/Home';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Layout>
      <Home />
    </Layout>
  </React.StrictMode>,
);
