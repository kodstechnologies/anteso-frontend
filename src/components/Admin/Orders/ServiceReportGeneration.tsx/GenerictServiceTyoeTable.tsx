import React from 'react';
import { useLocation } from 'react-router-dom';

// ---- 1. Import every report component (create them in separate files) ----
import CTScanReport from '../ServiceReportGeneration.tsx/TestTables/CTScan/GenerateReport-CTScan';
import InventionalRadiology from './TestTables/Inventional-Radiology/GenerateReportInventionalRadiology';
import MammographyReport from "./TestTables/Mammography/GenerateReportMammography"
import CArmReport from "./TestTables/CArm/GenerateReportForCArm"
import BMDReport from "./TestTables/BMD/GenerateReportForBMD"
import RadioFluro from "./TestTables/FixedRadioFluro/GenerateServiceReport"
import DentalReport from "./TestTables/DentalIntra/GenerateServiceReport"
import CBCTReport from "./TestTables/DentalConeBeamCT/GenerateServiceReport"
import OPGReport from "./TestTables/OPG/GenerateServiceReport"
import RadiographyFixed from './TestTables/RadiographyFixed/GeneraateServiceReport';
import DentalHandHeldReport from "./TestTables/DentalHandHeld/GenerateServiceReport"
import RadiographyMobileHTReport from "./TestTables/RadiographyMobileHT/GenerateServiceReport"
import RadiographyPortableReport from "./TestTables/RadiographyPortable/GenerateServiceReport"
import RadiographyMobileReport from "./TestTables/RadiographyMobile/GenerateServiceReport"
import OArmReport from "./TestTables/OArm/GenerateReportForOArm"
import LeadApronReport from "./TestTables/LeadApron/GenerateServiceReport"
import KVImagingReport from "./TestTables/OBI/GenerateServiceReport"
// import RadioF
// import CBCTReport from './reports/CBCTReport';
// import FixedXRayReport from './reports/FixedXRayReport';
// import MobileXRayReport from './reports/MobileXRayReport';
// import CArmReport from './reports/CArmReport';
// import CathLabReport from './reports/CathLabReport';
// import MammographyReport from './reports/MammographyReport';
// import PETCTReport from './reports/PETCTReport';
// import CTSimulatorReport from './reports/CTSimulatorReport';
// import OPGReport from './reports/OPGReport';
// import BMDReport from './reports/BMDReport';
// import DentalIOPAreport from './reports/DentalIOPAreport';
// import DentalHandHeldReport from './reports/DentalHandHeldReport';
// import OArmReport from './reports/OArmReport';
// import KVImagingReport from './reports/KVImagingReport';
// import LeadApronReport from './reports/LeadApronReport';
// import ThyroidShieldReport from './reports/ThyroidShieldReport';
// import GonadShieldReport from './reports/GonadShieldReport';
// import RadiationSurveyReport from './reports/RadiationSurveyReport';
// import OthersReport from './reports/OthersReport';

// ---- 2. Map machine → component ---------------------------------------
const REPORT_MAP: Record<string, React.FC<{ serviceId: string }>> = {
  // 'Fixed X-Ray': FixedXRayReport,
  // 'Mobile X-Ray': MobileXRayReport,
  'C-Arm': CArmReport,
  'Interventional Radiology': InventionalRadiology,
  "Mammography": MammographyReport,
  'Computed Tomography': CTScanReport,
  // 'PET CT': PETCTReport,
  'Radiography (Fixed)': RadiographyFixed,
  "Ortho Pantomography (OPG)": OPGReport,
  "Dental Cone Beam CT": CBCTReport,
  'Bone Densitometer (BMD)': BMDReport,
  // 'Dental IOPA': DentalIOPAreport,
  'Dental (Intra Oral)': DentalReport,
  'Dental (Hand-held)': DentalHandHeldReport,
  'Radiography (Mobile) with HT': RadiographyMobileHTReport,
  'Radiography (Portable)': RadiographyPortableReport,
  'Radiography (Mobile)': RadiographyMobileReport,
  'O-Arm': OArmReport,
  'Lead Apron': LeadApronReport,
  // 'Thyroid Shield Test': ThyroidShieldReport,
  'Radiography and Fluoroscopy': RadioFluro,
  'KV Imaging (OBI)': KVImagingReport,
  // 'Radiation Survey of Radiation Facility': RadiationSurveyReport,
  // Others: OthersReport,

};

// ---- 3. The page component --------------------------------------------
const GenerateServiceReport: React.FC = () => {
  console.log("GenerateServiceReport component loaded");
  const location = useLocation();
  console.log("📦 Location state →", location.state);

  const { state } = location as { state?: { serviceId?: string; machineType?: string } };

  console.log("🧭 From location.state:", state);

  if (!state?.serviceId || !state?.machineType) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Missing serviceId or machineType. Go back and try again.</p>
      </div>
    );
  }

  const { serviceId, machineType } = state;

  // ---- 5. Find the correct component ------------------------------------
  const ReportComponent = REPORT_MAP[machineType];

  if (!ReportComponent) {
    return (
      <div className="p-8 text-center text-orange-600">
        <p>No report defined for machine type: <strong>{machineType}</strong></p>
      </div>
    );
  }

  // ---- 6. Render it with serviceId ---------------------------------------
  return <ReportComponent serviceId={serviceId} />;
};

export default GenerateServiceReport;