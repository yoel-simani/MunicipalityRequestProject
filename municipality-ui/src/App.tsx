import { Routes, Route, Navigate, useParams } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { setCurrentMunicipality } from "./config/municipalityConfig";
import { getMunicipalityById } from "./municipalities";

function MunicipalityRoute() {
  const { municipalityId } = useParams();

  if (municipalityId) {
    const municipality = getMunicipalityById(municipalityId);
    if (municipality) {
      setCurrentMunicipality(municipality);
    } else {
      const fallback = getMunicipalityById('default');
      if (fallback) {
        setCurrentMunicipality(fallback);
      }
    }
  }

  return <HomePage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:municipalityId" element={<MunicipalityRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
