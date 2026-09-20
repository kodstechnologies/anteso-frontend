export const STANDARD_MACHINE_TYPES = [
    "Radiography (Fixed)",
    "Radiography (Mobile)",
    "Radiography (Portable)",
    "Radiography and Fluoroscopy",
    "Interventional Radiology",
    "C-Arm",
    "O-Arm",
    "Computed Tomography",
    "Mammography",
    "Dental Cone Beam CT",
    "Ortho Pantomography (OPG)",
    "Dental (Intra Oral)",
    "Dental (Hand-held)",
    "Bone Densitometer (BMD)",
    "KV Imaging (OBI)",
    "Radiography (Mobile) with HT",
    "Lead Apron/Thyroid Shield/Gonad Shield",
] as const;

export const MACHINE_TYPES_WITH_OTHERS = [...STANDARD_MACHINE_TYPES, "Others"];

type LeadOwnerEntity = {
    _id?: string;
    qaTests?: Array<{ testName?: string } | string>;
};

const normalizeLeadOwnerId = (leadOwner: unknown): string => {
    if (!leadOwner) return "";
    if (typeof leadOwner === "string") return leadOwner;
    if (typeof leadOwner === "object" && leadOwner !== null && "_id" in leadOwner) {
        return String((leadOwner as { _id?: string })._id || "");
    }
    return String(leadOwner);
};

export const getLeadOwnerMachineTypeFilter = (
    leadOwnerId: unknown,
    dealers: LeadOwnerEntity[] = [],
    manufacturers: LeadOwnerEntity[] = []
): { isRestricted: boolean; allowedMachineTypes: string[] } => {
    const id = normalizeLeadOwnerId(leadOwnerId);
    if (!id) {
        return { isRestricted: false, allowedMachineTypes: [] };
    }

    const selectedDealer = dealers.find((dealer) => String(dealer._id) === id);
    const selectedManufacturer = manufacturers.find((manufacturer) => String(manufacturer._id) === id);

    if (!selectedDealer && !selectedManufacturer) {
        return { isRestricted: false, allowedMachineTypes: [] };
    }

    const qaTests = selectedDealer?.qaTests || selectedManufacturer?.qaTests || [];
    const allowedMachineTypes = qaTests
        .map((test) => (typeof test === "string" ? test : test?.testName || ""))
        .map((name) => name.trim())
        .filter(Boolean);

    return {
        isRestricted: true,
        allowedMachineTypes,
    };
};

export const getVisibleMachineTypes = (
    isRestricted: boolean,
    allowedMachineTypes: string[]
): string[] => {
    if (!isRestricted) {
        return [...MACHINE_TYPES_WITH_OTHERS];
    }

    const visible = STANDARD_MACHINE_TYPES.filter((type) => allowedMachineTypes.includes(type));
    return [...visible, "Others"];
};
