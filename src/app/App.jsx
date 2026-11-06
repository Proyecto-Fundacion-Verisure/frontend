import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from '../features/auth';
import ErrorFallback from './errors/ErrorFallback';
import AppRouter from './routing/AppRouter';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <AppRouter />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
