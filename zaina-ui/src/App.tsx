import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ManagePage from './pages/ManagePage';
import StudyPage from './pages/StudyPage';
import PracticePage from './pages/PracticePage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/study" replace />} />
          <Route path="manage" element={<ManagePage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
