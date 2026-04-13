import { useState, useEffect } from 'react';
import SOSModal from './SOSModal';
import SupportModal from './SupportModal';
import CrisisLineModal from './CrisisLineModal';

export default function GlobalModals() {
  const [sosOpen, setSosOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);

  useEffect(() => {
    const openSos = () => setSosOpen(true);
    const openSupport = () => setSupportOpen(true);
    const openCrisis = () => setCrisisOpen(true);

    window.addEventListener('open-sos', openSos);
    window.addEventListener('open-support', openSupport);
    window.addEventListener('open-crisis-line', openCrisis);

    return () => {
      window.removeEventListener('open-sos', openSos);
      window.removeEventListener('open-support', openSupport);
      window.removeEventListener('open-crisis-line', openCrisis);
    };
  }, []);

  return (
    <>
      <SOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      <CrisisLineModal isOpen={crisisOpen} onClose={() => setCrisisOpen(false)} />
    </>
  );
}
