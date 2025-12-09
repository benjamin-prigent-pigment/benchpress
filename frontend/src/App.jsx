import { Routes, Route } from 'react-router-dom';
import SideNav from './components/header/SideNav';
import TemplatesList from './pages/TemplatesList';
import TemplateItem from './pages/TemplateItem';
import ComponentsList from './pages/ComponentsList';
import ComponentItem from './pages/ComponentItem';
import ResultsList from './pages/ResultsList';
import ResultItem from './pages/ResultItem';
import CompareResults from './pages/CompareResults';
import './App.css';

function App() {
  return (
    <div className="app">
      <SideNav />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TemplatesList />} />
          <Route path="/templates" element={<TemplatesList />} />
          <Route path="/templates/:id" element={<TemplateItem />} />
          <Route path="/components" element={<ComponentsList />} />
          <Route path="/components/new" element={<ComponentItem />} />
          <Route path="/components/:id" element={<ComponentItem />} />
          <Route path="/results" element={<ResultsList />} />
          <Route path="/results/:id" element={<ResultItem />} />
          <Route path="/results/compare" element={<CompareResults />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
