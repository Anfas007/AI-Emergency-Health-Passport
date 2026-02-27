import MedicalHistoryViewer from "../components/MedicalHistoryViewer";

export default function PatientHistory() {
  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Patient Medical History</h2>
      <p className="page-subtitle">View complete medical history records</p>
      <MedicalHistoryViewer />
    </div>
  );
}
