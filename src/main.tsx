import ReactDOM from 'react-dom/client';
import App from './App';
import './ui/styles.css';

// StrictMode is intentionally omitted: it double-mounts effects, which would boot Phaser twice.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
