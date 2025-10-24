import { ClawMachineV2 } from './features/claw/ClawMachineV2';

export function App() {
  return (
    <div style={{ width: '100%', maxWidth: '1200px' }}>
      <ClawMachineV2 showDevControls={true} />
    </div>
  );
}
