import axios from 'axios'
import { log } from 'console';
import Cookies from 'js-cookie';

const VITE_BACKEND_LOCALHOST_API_URL = import.meta.env.VITE_BACKEND_API_URL;
const VITE_BACKEND_API_URL_OTP = import.meta.env.VITE_BACKEND_API_URL_OTP;

const api = axios.create({
    baseURL: VITE_BACKEND_LOCALHOST_API_URL,
});
const otpApi = axios.create({
    baseURL: VITE_BACKEND_API_URL_OTP,
});

api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token is invalid or expired
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const adminLogin = async (payload: any) => {
    try {
        const res = await api.post('/auth/login', payload)
        return res;
    } catch (error) {
        console.error("🚀 ~ adminLogin ~ error:", error);
        throw error;
    }
}

export const sendOTp = async (mobileNumber: string) => {
    try {
        const res = await api.post('/auth/send-otp-staff', { mobileNumber });
        return res;
    } catch (error) {
        console.error("🚀 ~ sendOTp ~ error:", error);
        throw error;
    }
}

export const verifyOtp = async (mobileNumber: string, otp: string) => {
    try {
        const res = await api.post('/auth/verify-otp-staff', { mobileNumber, otp });
        return res;
    } catch (error) {
        console.error("🚀 ~ verifyOtp ~ error:", error);
        throw error;
    }
}

export const resetPassword = async (phone: string, password: string) => {
    try {
        const res = await api.post('/auth/reset-password', { phone, password });
        return res;
    } catch (error) {
        console.error("🚀 ~ resetPassword ~ error:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        // Call backend logout API
        await otpApi.post('/logout'); // adjust endpoint if needed

        // Clear accessToken and refreshToken from cookies
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');

        // Redirect to login page
        window.location.href = '/login';
    } catch (error) {
        console.error("Logout failed:", error);
        // Optional: show a message to the user
    }
};

export const getAllMachinesByHospitalId = async (id: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await otpApi.get(`/machines/get-machine-by-hospital/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },

        })
        console.log("🚀 ~ getAllMachinesByHospitalId ~ res:", res)
        return res.data;

    } catch (error) {
        console.error("🚀 ~ getAllMachinesByHospitalId ~ error:", error);
        throw error;
    }
}

export const addclient = async (clientData: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.post('/clients/create', clientData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },

        });
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ addclient ~ error:", error?.response?.data || error.message);
        throw error;
    }
};

//clients
export const getAllClients = async () => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get('/clients/get-all', {
            headers: {
                Authorization: `Bearer ${token}`,
            },

        })
        return res.data;

    } catch (error) {
        console.error("🚀 ~ getAllClients ~ error:", error);
        throw error;
    }
}

export const deleteClientById = async (clientId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.delete(`/clients/delete-by-id/${clientId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ deleteClientById ~ error:", error);
        throw error;
    }
};
export const getClientById = async (clientId: any) => {
    try {
        const token = Cookies.get('accessToken');

        const res = await api.get(`/clients/get-by-id/${clientId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data; // This will contain client data and message
    } catch (error: any) {
        console.error("🚀 ~ getClientById ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
};
export const updateClientById = async (clientId: any, updatedData: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/clients/update/${clientId}`, updatedData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ updateClientById ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to update client data"
        );
    }
};


//view of clients
// export const getHospitalsByClientId = async (clientId: any) => {
//     // console.log("🚀 ~ getHospitalsByClientId ~ clientId:", clientId)
//     try {
//         const token = Cookies.get('accessToken');
//         const res = await api.get(`/hospital/get-allHospitals-by-client/${clientId}`, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         })
//         // console.log("🚀 ~ getHospitalsByClientId ~ res.data:", res.data)
//         return res.data;
//     } catch (error: any) {
//         console.error("🚀 ~ getClientById ~ error:", error);

//         throw new Error(
//             error?.response?.data?.message || "Failed to fetch client data"
//         );
//     }
// }
// export const getInstituteByClientId = async (clientId: any) => {
//     try {
//         const token = Cookies.get('accessToken');
//         const res = await api.get(`/institute/get-allHospitals-by-client/${clientId}`, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         })
//         console.log("🚀 ~ getHospitalsByClientId ~ res.data:", res.data)
//         return res.data;
//     } catch (error: any) {
//         console.error("🚀 ~ getClientById ~ error:", error);

//         throw new Error(
//             error?.response?.data?.message || "Failed to fetch client data"
//         );
//     }
// }
// export const getRsosByClientId = async (clientId: any) => {
//     console.log("🚀 ~ getRsosByClientId ~ clientId:", clientId)
//     try {
//         const token = Cookies.get('accessToken');
//         const res = await api.get(`/rso/get-allRso-by-client/${clientId}`, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         })
//         // console.log("🚀 ~ getHospitalsByClientId ~ res.data:", res.data)
//         return res.data;
//     } catch (error: any) {
//         console.error("🚀 ~ getClientById ~ error:", error);

//         throw new Error(
//             error?.response?.data?.message || "Failed to fetch client data"
//         );
//     }
// }

//post for hospital rso and institute
export const createHospitalByClientId = async (clientId: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.post(`/hospital/create-hospital-by-client/${clientId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ createRsoByClientId ~ error:", error?.response?.data || error.message);
        throw error;
    }
}
export const getAllHospitalsByClientId = async (clientId: any) => {
    try {
        const token = Cookies.get('accessToken');
        console.log("🚀 ~ getAllHospitalsByClientId ~ token:", token)
        const res = await api.get(`/hospital/get-allHospitals-by-client/${clientId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getAllHospitalsByClientId ~ res.data:", res.data)
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ all hospitalsByClientId ~ error:", error?.response?.data || error.message);
        throw error;
    }
}


export const createRsoByHospitalId = async (hospitalId: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken');

        console.log("📦 Payload being sent:", payload);

        const res = await api.post(`/rso/create-rso-by-hospitalId/${hospitalId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`
                // 'Content-Type': 'application/json', // ← Important
            },
        });

        return res.data;
    } catch (error: any) {
        console.error("❌ Error in createRsoByClientId:", error?.response?.data || error.message);
        throw error;
    }
};
export const createInstituteByHospitalId = async (hospitalId: any, payload: any) => {
    console.log("🚀 ~ createInstituteByHospitalId ~ hospitalId:", hospitalId)
    try {
        const token = Cookies.get('accessToken');
        const res = await api.post(`/institute/create-institute-by-hospitalId/${hospitalId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ createInstituteByHospitalId ~ res:", res)
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ createinstituteByClientId ~ error:", error?.response?.data || error.message);
        throw error;
    }
}


//get all hospitals,rsos and institute
export const getAllRsosByhospitalId = async (hospitalId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/rso/get-all-rso-by-hospitalId/${hospitalId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ get all rso ~ error:", error?.response?.data || error.message);
        throw error;
    }
}
export const getAllIstitutesByhospitalId = async (hospitalId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/institute/get-all-institutes-by-hospitalId/${hospitalId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ get all institutes ~ error:", error?.response?.data || error.message);
        throw error;
    }
}

//get hopital,rso,institute by id
export const getHospitalByClientIdAndHospitalId = async (clientId: any, hospitalId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/hospital/get-hospital-by-clienId-and-hospitalId/${clientId}/${hospitalId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ get hospital ~ error:", error?.response?.data || error.message);
        throw error;
    }
}

export const getInstituteByHospitalIdAndInstituteId = async (hospitalId: any, instituteId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/institute/get-institute-by-hospitalId-instituteId/${hospitalId}/${instituteId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ get institute ~ error:", error?.response?.data || error.message);
        throw error;
    }
}
export const getRsoByHospitalIdAndRsoId = async (hospitalId: any, rsoId: any) => {
    console.log("🚀 ~ getRsoByClientIdAndRsoId ~ rsoId:", rsoId)
    console.log("🚀 ~ getRsoByClientIdAndRsoId ~ clientId:", hospitalId)
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/rso/get-rso-by-hospitalId-rsoId/${hospitalId}/${rsoId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ get rso ~ error:", error?.response?.data || error.message);
        throw error;
    }
}


//edit hospital,rso,institute
export const editHospitalByClientIDandHospitalId = async (clientId: any, hospitalId: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/hospital/update-hospital-by-client/${clientId}/${hospitalId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ get all institutes ~ error:", error?.response?.data || error.message);
        throw error;
    }
}
export const editInstituteByHospitalIdandInstituteId = async (hospitalId: any, InstituteId: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/institute/update-institute-by-hospitalId-instituteId/${hospitalId}/${InstituteId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ get all institutes ~ error:", error?.response?.data || error.message);
        throw error;
    }
}
// export const editRsohospitalIdandRsoId = async (hospitalId: any, rsoId: any, payload: any) => {
//     console.log("🚀 ~ editRsoByClientIDandRsoId ~ rsoId:", rsoId)
//     console.log("🚀 ~ editRsoByClientIDandRsoId ~ clientId:", hospitalId)
//     try {
//         const token = Cookies.get('accessToken');
//         const res = await api.put(`/rso/edit/${hospitalId}/${rsoId}`, payload, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 "Content-Type": "multipart/form-data", // 👈 add this
//             },
//         })
//         return res.data
//     } catch (error: any) {
//         // console.log("🚀 ~ createRsoByClientId ~ error:", error)
//         console.error("🚀 ~update rso ~ error:", error?.response?.data || error.message);
//         throw error;
//     }
// }

//delete hospital,rso and institute

export const editRsohospitalIdandRsoId = async (hospitalId: any, rsoId: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/rso/edit/${hospitalId}/${rsoId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Remove Content-Type — let browser set it with boundary
                // "Content-Type": "multipart/form-data",
            },
        });
        return res.data;
    } catch (error: any) {
        console.error("Update RSO error:", error?.response?.data || error.message);
        throw error;
    }
};

export const deleteHospitalByClientIdAndHospitalId = async (clientId: any, hospitalId: any,) => {
    console.log("🚀 ~ deleteHospitalByClientIdAndHospitalId ~ hospitalId:", hospitalId)
    try {
        const token = Cookies.get('accessToken');
        const res = await api.delete(`/hospital/delete-hospital-by-id/${clientId}/${hospitalId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ deleteHospitalByClientIdAndHospitalId ~ res.data:", res)
        return res
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ delete hospital ~ error:", error?.response?.data || error.message);
        throw error;
    }
}
export const deleteInstituteByHospitalIdAndInstituteId = async (hospitalId: any, InstituteId: any,) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.delete(`/institute/delete-institute-by-hospitalId-instituteId/${hospitalId}/${InstituteId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~delete institute ~ error:", error?.response?.data || error.message);
        throw error;
    }
}
export const deleteRsoByHospitalIdAndRsoId = async (hospitalId: any, rsoId: any,) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.delete(`/rso/delete-rso-by-hospitalId-rsoId/${hospitalId}/${rsoId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~delete rso~ error:", error?.response?.data || error.message);
        throw error;
    }
}


// export const getAllHospitalsByClientId = async () => {
//     try {

//     } catch (error) {

//     }
// }

export const addEnquiry = async (payload: any) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.post("/enquiry/add", payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log("🚀 ~ addEnquiry ~ res:", res)
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ addEnquiry ~ error:", error);
        throw new Error(error?.response?.data?.message || "Failed to submit enquiry");
    }
};

export const addEnquiryCreateDirectOrder = async (payload: any) => {
    try {
        const token = Cookies.get('accessToken');

        // Convert payload to FormData
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
            if (key === "services" || key === "additionalServices") {
                formData.append(key, JSON.stringify(payload[key])); // Convert arrays/objects to JSON string
            } else if (key === "attachment" && payload[key]) {
                formData.append(key, payload[key]);
            } else if (key !== "attachment") {
                formData.append(key, payload[key]);
            }
        });

        const res = await api.post('/enquiry/create-direct-order-from-enquiry', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ addEnquiryCreateDirectOrder ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to submit enquiry"
        );
    }
};

//used in add quotation
export const getEnquiryById = async (enquiryId: any) => {
    // console.log("🚀 ~ getEnquiryById ~ enquiryId:", enquiryId)
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/enquiry/get-by-id/${enquiryId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getClientById ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const deleteEnquiryById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.delete(`/enquiry/delete-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ deleteClientById ~ error:", error);
        throw error;
    }
}
export const getAllEnquiry = async () => {
    try {
        const token = Cookies.get('accessToken')
        // console.log("🚀 ~ getAllEnquiry ~ token:", token)
        const res = await api.get('/enquiry/get-all', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllEnquiry ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getClientById ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const getQuotationByCustomerAndEnquiryId = async (customerId: any, enquiryId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/enquiry/get-quotation-by-customer-enq-quo-ids/${customerId}/${enquiryId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getQuotationByCustomerAndEnquiryId ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getQuotationByCustomerAndEnquiryId ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}


//used in quotation
export const allEmployees = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get('/technician/all-officeStaff', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data.data
    } catch (error: any) {
        console.error("🚀 ~ getClientById ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const editEnquiry = async () => {
    try {
        const token = Cookies.get('accessToken')
    } catch (error) {

    }
}
export const createQuotationByEnquiryId = async (payload: any, id: any) => {
    try {
        const token = Cookies.get('accessToken');
        console.log("INSIDE 🚀 ~ createQuotationByEnquiryId ~ createQuotationByEnquiryId:")
        console.log("🚀 ~ createQuotationByEnquiryId ~ payload:", payload)
        const res = await api.post(`/quotation/create/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },

        });

        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ addclient ~ error:", error?.response?.data || error.message);
        throw error;
    }
}
export const getQuotationByEEnquiryId = async (enquiryId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/quotation/get-by-enquiry-id/${enquiryId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~getQuotationByEEnquiryId ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch getQuotationByEEnquiryId"
        );
    }
}

//employee CRUD
// export const addEmployee = async (payload: any) => {
//     console.log("🚀 ~ addEmployee ~ payload:", payload)
//     try {
//         const token = Cookies.get('accessToken')
//         const res = await api.post('/technician/add', payload, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         })
//         return res.data
//     } catch (error: any) {
//         console.error("🚀 ~ add employee ~ error:", error);

//         throw new Error(
//             error?.response?.data?.message || "Failed to fetch client data"
//         );
//     }
// }

// src/api/employeeApi.ts
export const addEmployee = async (payload: any) => {
    console.log("🚀 ~ addEmployee ~ payload:", payload);
    try {
        const token = Cookies.get('accessToken');

        const res = await api.post('/technician/add', payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // ✅ important
            },
        });

        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ add employee ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to add employee"
        );
    }
};


// export const editEmployee = async (id: any, payload: any) => {
//     try {
//         const token = Cookies.get('accessToken')
//         const res = await api.put(`/technician/update-by-id/${id}`, payload, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         })
//         return res.data
//     } catch (error: any) {
//         console.error("🚀 ~ edit employee ~ error:", error);
//         throw new Error(
//             error?.response?.data?.message || "Failed to fetch client data"
//         );
//     }
// }

export const editEmployee = async (id: string, payload: Record<string, any>) => {
    try {
        const token = Cookies.get("accessToken");
        const formData = new FormData();

        // ✅ Append text fields
        Object.entries(payload).forEach(([key, value]) => {
            if (
                key !== "doc1" &&
                key !== "doc2" &&
                key !== "doc3" &&
                key !== "tools"
            ) {
                if (value !== undefined && value !== null) {
                    // Convert non-string values to string
                    formData.append(key, value instanceof Blob ? value : String(value));
                }
            }
        });

        // ✅ Handle tools array (convert to JSON string)
        if (Array.isArray(payload.tools)) {
            formData.append("tools", JSON.stringify(payload.tools));
        }

        // ✅ Handle document uploads (optional)
        ["doc1", "doc2", "doc3"].forEach((key) => {
            const file = payload[key];
            if (file && file instanceof File) {
                formData.append(key, file);
            }
        });

        // 🔹 API call
        const res = await api.put(`/technician/update-by-id/${id}`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ editEmployee ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to update employee"
        );
    }
};

export const getAllEmployees = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/all-employees`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ all employees ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

// export const getEmployeeById = async (id: any) => {
//     console.log("🚀 ~ getEmployeeById ~ id:", id)
//     try {
//         console.log("inside getEmployeeById");

//         const token = Cookies.get('accessToken')
//         const res = await api.get(`/technician/get-by-id/${id}`, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         })
//         console.log("🚀 ~ getEmployeeById ~ res:", res)
//         return res.data
//     } catch (error: any) {
//         console.error("🚀 ~ get employee by id ~ error:", error);
//         throw new Error(
//             error?.response?.data?.message || "Failed to fetch client data"
//         );
//     }
// }

export const getEmployeeById = async (id: string) => {
    // console.log("getEmployeeById ~ id:", id);
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/technician/get-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        // console.log("getEmployeeById ~ res:", res);
        return res.data;
    } catch (error: any) {
        console.error("get employee by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch employee data"
        );
    }
};

export const deleteEmployeeById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.delete(`/technician/delete-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ delete employee by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}


export const getEnquiryDetailsById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/enquiry/get-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ get employee by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

//quotation view
export const getQuotationByEnquiryId = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/quotation/get-by-quotation-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ get quotation by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const addCourier = async (payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.post('/courier/add', payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ addCourier ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ add courier ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const editCourier = async (id: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/courier/update-by-id/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ edit courier ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const deleteCourier = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.delete(`/courier/delete-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ delete courier by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const getCourierById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/courier/get-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getCourierById ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ get courier by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const getAllCourier = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/courier/get-all`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ all courier companies ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const addLeave = async (payload: any) => {
    console.log("🚀 ~ addLeave ~ payload:", payload)
    try {
        const token = Cookies.get('accessToken')
        const res = await api.post('/leaves/add', payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ addCourier ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ add leaves ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const getAllLeave = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/leaves/all-leaves`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllLeave ~ res:", res.data.data.data)
        return res.data.data
    } catch (error: any) {
        console.error("🚀 ~ all courier companies ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const getLeaveById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/leaves/get-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getLeaveById ~ res.data:", res.data)
        return res.data.data
    } catch (error: any) {
        console.error("🚀 ~ get leaves by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const editLeaveById = async (id: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/leaves/update/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ edit courier ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const deleteLeaveById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.delete(`/leaves/delete/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ delete leave by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const getLeavesPerEmployee = async (employeeId: string, year: number) => {
    try {
        const res = await api.get(`/leaves/get-leaves-for-employee/${employeeId}?year=${year}`);
        return res.data;
    } catch (error: any) {
        console.error("Error fetching leaves summary:", error);
        throw error.response?.data || { message: "Failed to fetch leave summary" };
    }
};

//tools
export const addTools = async (payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.post('/tools/add', payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ addCourier ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ add tools ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const AllTools = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/tools/all-tools`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllTools ~ res:", res.data)
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ all  tools ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const getByToolId = async (id: any) => {
    try {
        console.log("hi")
        const token = Cookies.get('accessToken')
        const res = await api.get(`/tools/get-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getToolById ~ res.data:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ get tools by id ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const getUnAssignedTools = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get('/technician/unassigned-tools', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ get tools unassigned ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}


export const getEngineerByToolId = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/tools/get-engineer-by-tool/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~getEngineerByToolId~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed getEngineerByToolId"
        );
    }
}

export const deleteToolById = async (id: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.delete(`/tools/delete/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ deletePaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
}


//orders
export const getAllOrders = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-all`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllorders ~ res:", res.data)
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ all  orders ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const getBasicDetailsByOrderId = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/basic-details-by-orderId/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ basic details ~ res:", res.data)
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~   orders basic details ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

//orders view
export const getAdditionalServicesByOrderId = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/additional-services/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ basic details ~ res--------->from index :", res.data)
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~   orders basic details ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

// export const getDealerById = async (id: any) => {
//     try {
//         const token = Cookies.get('accessToken')
//         const res = await api.get(`/dealer/get-by-id/${id}`{
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             }
//         })
//     } catch (error) {

//     }
// }
export const getServices = async (orderId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/service-details-of-orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log('+++++++++++++++++++++++++++++++++++++++++');

        console.log("🚀 ~ getAAllServices ~ res:", res.data)
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ all  orders ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const getAllTechnicians = async () => {
    try {
        const token = Cookies.get('accessToken')
        // console.log("hi from getAllTechnicianss");

        const res = await api.get('/technician/get-all', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllTechnicians ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ all  technicians ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch technician data"
        );
    }
}

// 2.
export const getMachineDetails = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/machine-details/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data.data
    } catch (error: any) {
        console.error("🚀 ~ all  machines ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch machines data"
        );
    }

}

// 1.
// export const getMachineDetails = async (id: any) => {
//     try {
//         const token = Cookies.get('accessToken')
//         const res = await api.get(`/orders/machine-details/${id}`, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             },
//         })
//         return res.data
//     } catch (error: any) {
//         console.error("🚀 ~ all  machines ~ error:", error);
//         throw new Error(
//             error?.response?.data?.message || "Failed to fetch machines data"
//         );
//     }
// }

export const getAllOfficeStaff = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/all-officeStaff`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllOfficeStaff ~ res:", res)
        return res.data.data
    } catch (error: any) {
        console.error("🚀 ~ all  machines ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch machines data"
        );
    }
}
export const updateEmployeeWithStatus = async (orderId: string, serviceId: string, employeeId: string, status: string,) => {
    console.log("🚀 ~ updateEmployeeWithStatus ~ status:", status)
    console.log("🚀 ~ updateEmployeeWithStatus ~ employeeId:", employeeId)
    console.log("🚀 ~ updateEmployeeWithStatus ~ serviceId:", serviceId)
    console.log("🚀 ~ updateEmployeeWithStatus ~ orderId:", orderId)
    try {
        const token = Cookies.get('accessToken')
        const res = await api.patch(`/orders/update-employee/${orderId}/${serviceId}/${employeeId}/${status}`, {
            orderId,
            serviceId,
            employeeId,
            status,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀  ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch "
        );
    }
}

export const assignToTechnicianByQA = async (
    orderId: string,
    serviceId: string,
    technicianId: string,
    worktype: string
) => {
    try {
        const token = Cookies.get("accessToken");
        const encodedWorkType = encodeURIComponent(worktype);
        const res = await api.put(
            `/orders/assign-to-technician/${orderId}/${serviceId}/${technicianId}/${encodedWorkType}`,
            {}, // no body since everything is in params
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return res.data;
    } catch (error: any) {
        console.error("🚀  ~ error:", error);
        throw new Error(error?.response?.data?.message || "Failed to assign technician");
    }
};

export const getQARaw = async (orderId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-qa-raw/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ all  machines ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}


export const getReportNumbers = async (orderId: string, serviceId: string, technicianId: string, workType: string) => {
    console.log("🚀 ~ getReportNumbers ~ workType:", workType)
    console.log("🚀 ~ getReportNumbers ~ technicianId:", technicianId)
    console.log("🚀 ~ getReportNumbers ~ serviceId:", serviceId)
    console.log("🚀 ~ getReportNumbers ~ orderId:", orderId)
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-report-numbers/${orderId}/${serviceId}/${technicianId}/${workType}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getReportNumbers ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~getReportNumbers ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getReportNumbers"
        );
    }
}


export const completedOrderStatus = async () => {
    try {
        const token = Cookies.get('accessToken')

    } catch (error) {

    }
}


export const assignToOfficeStaff = async (orderId: string, serviceId: string, officeStaffId: string, workType: string, status: any) => {
    console.log("🚀 ~ assignToOfficeStaff ~ status:", status)
    console.log("🚀 ~ assignToOfficeStaff ~ workType:", workType)
    console.log("🚀 ~ assignToOfficeStaff ~ officeStaffId:", officeStaffId)
    console.log("🚀 ~ assignToOfficeStaff ~ serviceId:", serviceId)
    console.log("🚀 ~ assignToOfficeStaff ~ orderId:", orderId)
    console.log("==assignToOfficeStaff==");

    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/orders/assign-to-office-staff/${orderId}/${serviceId}/${officeStaffId}/${workType}/${status}`, {
            orderId,
            serviceId,
            officeStaffId,
            workType,
            status

        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀  ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch "
        );
    }
}


export const assignToOfficeStaffElora = async () => {
    try {

    } catch (error) {

    }
}
//dummy
export const getAlltripsByTechnicianId = async (id: string) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/get-trips-per-technician/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAlltripsByTechnicianId ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ all  trips ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const addAdvance = async (id: string, payload: { advancedAmount: number }) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.post(`/advance/add-advance-to-technician/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ addAdvance ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const getAssignedTechnicianName = async (orderId: any, serviceId: any, worktype: any) => {
    console.log("🚀 ~ getAssignedTechnicianName ~ worktype:", worktype)
    console.log("🚀 ~ getAssignedTechnicianName ~ serviceId:", serviceId)
    console.log("🚀 ~ getAssignedTechnicianName ~ orderId:", orderId)
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-assigned-technician/${orderId}/${serviceId}/${worktype}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAssignedTechnicianName ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}
export const getAssignedStaffName = async (orderId: any, serviceId: any, worktype: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-assigned-staff/${orderId}/${serviceId}/${worktype}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAssignedStaffName ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}
// api/assignment.ts
export const fetchAssignedStaff = async (orderId: string, machineData: any[]) => {
    const assignments: Record<string, any> = {};
    const statuses: Record<string, string> = {};

    for (const service of machineData) {
        for (const workType of service.workTypes) {
            const workTypeId = workType.id;
            const serviceId = workTypeId.split("-")[0];
            const workTypeName = service.workTypeName || "Unknown";

            try {
                const res = await getAssignedStaffName(orderId, serviceId, workTypeName);
                const data = res.data;

                if (data.staff) {
                    assignments[workTypeId] = {
                        staffId: data.staff._id,
                        status: data.status || "pending",
                        isAssigned: true,
                        isReassigned: false,
                    };
                    statuses[workTypeId] = data.status || "pending";
                } else {
                    assignments[workTypeId] = {
                        staffId: null,
                        status: "pending",
                        isAssigned: false,
                        isReassigned: false,
                    };
                    statuses[workTypeId] = "pending";
                }
            } catch (err) {
                console.warn(`Failed to load assignment for ${workTypeId}`, err);
                assignments[workTypeId] = {
                    staffId: null,
                    status: "pending",
                    isAssigned: false,
                    isReassigned: false,
                };
                statuses[workTypeId] = "pending";
            }
        }
    }

    return { assignments, statuses };
};

export const getEngineerByTool = async (orderId: any, serviceId: any, worktype: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-assigned-staff/${orderId}/${serviceId}/${worktype}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAssignedStaffName ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const getMachineUpdates = async (technicianId: any, orderId: any, serviceId: any, worktype: any) => {
    try {
        const token = Cookies.get('accessToken')

        const res = await api.get(`/orders/get/${technicianId}/${orderId}/${serviceId}/${encodeURIComponent(worktype)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log('----before res log');
        console.log("🚀 ~ getMachineUpdates ~ res:", res)
        console.log('----after res log');

        return res
    } catch (error: any) {
        console.error("🚀 ~ getMachineUpdates ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const getEngineerByTools = async (toolId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-updated-order-services/${toolId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ getEngineerByTools ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const createOrder = async (payload: FormData) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.post(`/orders/create-order`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });
        return res;
    } catch (error: any) {
        console.error("🚀 ~ createOrder ~ error:", error);
        throw new Error(error?.response?.data?.message || "Failed to create order");
    }
};

// export const completeStatusAndReport = async (
//     technicianId: any,
//     orderId: any,
//     serviceId: any,
//     status: any,
//     payload: any,
//     workType: any,
//     file?: File[]
// ) => {
//     console.log('completeStatusAndReport api called');

//     console.log("🚀 ~ completeStatusAndReport ~ file:", file)
//     console.log("🚀 ~ completeStatusAndReport ~ status:", status)
//     console.log("🚀 ~ completeStatusAndReport ~ serviceId:", serviceId)
//     console.log("🚀 ~ completeStatusAndReport ~ orderId:", orderId)
//     console.log("🚀 ~ completeStatusAndReport ~ technicianId:", technicianId)
//     try {
//         const token = Cookies.get('accessToken')
//         let dataToSend: any
//         let headers: any = {
//             Authorization: `Bearer ${token}`,
//         }
//         console.log("HI FROM completeStatusAndReport");

//         if (file && file.length > 0) {
//             // send files + payload as FormData
//             const formData = new FormData()
//             formData.append("status", status)
//             formData.append("payload", JSON.stringify(payload))
//             file.forEach((file, idx) => {
//                 formData.append("file", file) // backend should accept 'files'
//             })
//             dataToSend = formData
//             headers["Content-Type"] = "multipart/form-data"
//         } else {
//             // fallback to JSON payload
//             dataToSend = { status, ...payload }
//             headers["Content-Type"] = "application/json"
//         }
//         const res = await api.post(
//             `/orders/completed-status-report/${technicianId}/${orderId}/${serviceId}/${workType}/${status}`,
//             dataToSend,
//             { headers }
//         )
//         return res
//     } catch (error: any) {
//         console.error("🚀 ~ completeStatusAndReport ~ error:", error);
//         throw new Error(
//             error?.response?.data?.message || "Failed to completeStatusAndReport"
//         );
//     }
// }

export const completeStatusAndReport = async (
    technicianId: string,
    orderId: string,
    serviceId: string,
    workType: string,
    status: string,
    payload: any,
    file?: File,
    reportType?: "qatest" | "elora" | string
) => {
    console.log("🚀 completeStatusAndReport called");
    console.log("file:", file);
    console.log("status:", status);
    console.log("serviceId:", serviceId);
    console.log("orderId:", orderId);
    console.log("technicianId:", technicianId);
    console.log("workType:", workType);
    console.log("reportType:", reportType);

    try {
        const token = Cookies.get("accessToken");
        let dataToSend: any;
        let headers: any = { Authorization: `Bearer ${token}` };

        if (file) {
            // Send single file + payload as FormData
            const formData = new FormData();
            formData.append("file", file); // backend expects 'file'
            formData.append("payload", JSON.stringify(payload)); // optional extra data
            dataToSend = formData;
            headers["Content-Type"] = "multipart/form-data";
        } else {
            dataToSend = { ...payload };
            headers["Content-Type"] = "application/json";
        }

        // Make sure to include reportType in the URL
        const res = await api.post(
            `/orders/completed-status-report/${technicianId}/${orderId}/${serviceId}/${workType}/${status}/${reportType}`,
            dataToSend,
            { headers }
        );

        console.log("🚀 ~ completeStatusAndReport ~ res:", res)
        return res;
    } catch (error: any) {
        console.error("🚀 completeStatusAndReport error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to completeStatusAndReport"
        );
    }
};

export const getAllDealers = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/dealers/get-all-dealers`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllDealers ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getEngineerByTools ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const createPayment = async (payload: any) => {
    console.log("🚀 ~ createPayment ~ payload:", payload)
    console.log("🚀 ~ createPayment payload entries:");
    for (const [key, val] of payload.entries()) {
        console.log(key, val);
    }

    try {
        const token = Cookies.get('accessToken')
        const res = await api.post(`/payment/add-payment`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ createPayment ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to createPayment"
        );
    }
}

export const allOrdersWithClient = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/payment/all-orders-with-client-name`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ allOrdersWithClient ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ allOrdersWithClient ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to allOrdersWithClient"
        );
    }
}

export const getTotalAmount = async (srfNumber: string) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/payment/get-total-amount`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { srfNumber }, // ✅ send srfNumber instead of orderId
        });
        return res;
    } catch (error: any) {
        console.error("Failed to get total amount", error);
        throw new Error(error?.response?.data?.message || "Failed to get total amount");
    }
};

export const getPaymentsBySrf = async (srfNumber: string) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.get(
            `/payment/get-payment-type-by-srf/${encodeURIComponent(srfNumber)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res;
    } catch (error: any) {
        console.error("Failed to get payments", error);
        throw new Error(error?.response?.data?.message || "Failed to get payments");
    }
};


export const getAllPayments = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/payment/get-all-payments`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllPayments ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getEngineerByTools ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const getAllStates = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/enquiry/all-states`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ all-states ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch all-states"
        );
    }
}

export const geAllAdvances = async (technicianId: string) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/expense/get-advance-amount/${technicianId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ geAllAdvances ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        )
    }
}

export const updateAdditionalService = async (id: string, payload: any) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.put(
            `/orders/update-additional-service/${id}`,
            payload, // send status + remark here
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ updateAdditionalService ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to update service"
        );
    }
};

export const getAdditionalServiceReport = async (orderId: any, additionalServiceId: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/orders/additional-service-report/${orderId}/${additionalServiceId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAdditionalServiceReport ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to fetch getAdditionalServiceReport"
        )
    }
}

export const getPaymentById = async (id: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/payment/get-payment-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ getPaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to fetch getPaymentById"
        )
    }
}

export const searchBySRFNumber = async (srfNumber: string) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/payment/search-by-srf`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                srfNumber, // pass SRF number as query parameter
            },
        });
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ searchBySRFNumber ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to fetch searchBySRFNumberd"
        )
    }
}

export const deletePaymentById = async (id: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.delete(`/payment/delete-payment-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ deletePaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
}

export const downloadQuotationPdf = async (
    quotationId: string,
    hospitalId: string,
    file: File
) => {
    console.log("🚀 ~ downloadQuotationPdf ~ hospitalId:", hospitalId)
    console.log("🚀 ~ downloadQuotationPdf ~ quotationId:", quotationId)
    try {
        const token = Cookies.get("accessToken")

        const formData = new FormData();
        formData.append("file", file); // must match `upload.single("file")` in backend

        const res = await api.post(
            `/quotation/save-quotation-pdf/${hospitalId}/${quotationId}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                },
            }
        );

        return res.data;
    } catch (error: any) {
        console.error("Error uploading quotation PDF:", error);
        throw error.response?.data || { message: "Failed to upload PDF" };
    }
};

export const sendQuotation = async (hospitalId: string, enquiryId: string, quotationId: string) => {
    console.log("🚀 ~ sendQuotation ~ quotationId:", quotationId)
    console.log("🚀 ~ sendQuotation ~ enquiryId:", enquiryId)
    console.log("🚀 ~ sendQuotation ~ hospitalId:", hospitalId)
    try {
        const token = Cookies.get("accessToken"); // get the JWT token

        if (!token) {
            throw new Error("User not authenticated");
        }
        const response = await api.post(
            `/quotation/share-quotation/${hospitalId}/${enquiryId}/${quotationId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data.success) {
            return response.data.data.pdfUrl; // return the PDF URL
        } else {
            throw new Error(response.data.message || "Failed to share quotation");
        }
    } catch (error: any) {
        console.error("Error sending quotation:", error);
        throw new Error(error.message || "Something went wrong");
    }
};



export const updateQuotationById = async (id: any, data: any) => {
    const token = Cookies.get('accessToken');
    try {
        console.log("🚀 ~ updateQuotationById ~ data:", data);
        const res = await api.put(`/quotation/edit-quotation/${id}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log("🚀 ~ updateQuotationById ~ res:", res);
        return res.data;
    } catch (error: any) {
        console.error("Error updating quotation:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to update quotation"
        );
    }
};

//Invoice APIS
export const getAllDetails = async (orderId: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/invoice/all-details-by-orderId/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllDetails ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getAllDetails ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to getAllDetails"
        )
    }
}

export const getAllSrfNumber = async () => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/invoice/all-orders-with-type`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllSrfNumber ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllSrfNumber ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to getAllSrfNumber"
        )
    }
}

export const createInvoice = async (invoiceData: any) => {
    try {
        const token = Cookies.get("accessToken");
        if (!token) {
            throw new Error("User is not authenticated");
        }
        const res = await api.post(
            `/invoice/create-invoice`,
            invoiceData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ createInvoice API error:", error.response || error.message);
        throw new Error(error.response?.data?.message || error.message || "Failed to create invoice");
    }
};

export const getAllInvoices = async () => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/invoice/get-all-invoices`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllInvoices ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllInvoices ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to getAllInvoices"
        )
    }
}

export const getInvoiceById = async (invoiceId: any) => {
    console.log("hi---");

    console.log("🚀 ~ getInvoiceById ~ invoiceId:", invoiceId)
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/invoice/get-invoice-by-id/${invoiceId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getInvoiceById ~ res:", res)
        // console.log("🚀 ~ getAllSrfNumber ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllSrfNumber ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to getAllSrfNumber"
        )
    }
}


export const deleteInvoice = async (id: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.delete(`/invoice/delete-invoice/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ deletePaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
}
// export const editDocuments = async (
//     orderId: string,
//     serviceId: string,
//     technicianId: string,
//     workType: string,
//     uploadFile: File | null,
//     viewFiles: File[]
// ) => {
//     try {
//         const token = Cookies.get("accessToken"); // if using JWT

//         const formData = new FormData();

//         // Append single file (optional)
//         if (uploadFile) {
//             formData.append("uploadFile", uploadFile);
//         }

//         // Append multiple files
//         if (viewFiles && viewFiles.length > 0) {
//             viewFiles.forEach((file) => {
//                 formData.append("viewFile", file);
//             });
//         }

//         const response = await api.patch(
//             `/orders/edit-documents/${orderId}/${serviceId}/${technicianId}/${workType}`,
//             formData,
//             {
//                 headers: {
//                     "Content-Type": "multipart/form-data",
//                     Authorization: `Bearer ${token}`, // if protected route
//                 },
//             }
//         );

//         return response.data;
//     } catch (error: any) {
//         console.error("🚀 ~ editDocuments error:", error);
//         throw new Error(error?.response?.data?.message || "File upload failed");
//     }
// };


export const editDocuments = async (
    orderId: string,
    serviceId: string,
    technicianId: string,
    workType: string,
    uploadFile: File | null,
    viewFiles: File[],
    action?: 'add' | 'replace_all' | 'replace' | 'delete', // Optional, default 'add' for backward compat
    targetIndex?: number // Optional, for 'replace' or 'delete'
) => {
    try {
        const token = Cookies.get("accessToken");

        const formData = new FormData();

        // Append action and targetIndex if provided
        if (action) {
            formData.append("action", action);
        }
        if (targetIndex !== undefined) {
            formData.append("targetIndex", targetIndex.toString());
        }

        // Append single file (optional, always replaces if provided)
        if (uploadFile) {
            formData.append("uploadFile", uploadFile);
        }

        // Append multiple files (for 'add', 'replace_all', or 'replace' with single file)
        if (viewFiles && viewFiles.length > 0) {
            viewFiles.forEach((file) => {
                formData.append("viewFile", file);
            });
        }
        // For 'delete', no files appended

        const response = await api.patch(
            `/orders/edit-documents/${orderId}/${serviceId}/${technicianId}/${workType}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error("🚀 ~ editDocuments error:", error);
        throw new Error(error?.response?.data?.message || "File update failed");
    }
};


export const getPaymentDeyailsByOrderId = async (orderId: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/payment/payment-details-by-orderId/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        console.log("🚀 ~ getPaymentDeyailsByOrderId ~ res.data:", res.data)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getPaymentDeyailsByOrderId ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to getAlgetPaymentDeyailsByOrderIdlSrfNumber"
        )
    }
}

export const staffLogin = async (payload: any) => {
    try {
        const res = await api.post('/auth/staff-login', payload)
        return res;
    } catch (error) {
        console.error("🚀 ~ adminLogin ~ error:", error);
        throw error;
    }
}

export const assignStaffByElora = async (orderId: string, serviceId: string, officeStaffId: string, workType: string, status: any) => {
    console.log("🚀 ~ assignToOfficeStaff ~ status:", status)
    console.log("🚀 ~ assignToOfficeStaff ~ workType:", workType)
    console.log("🚀 ~ assignToOfficeStaff ~ officeStaffId:", officeStaffId)
    console.log("🚀 ~ assignToOfficeStaff ~ serviceId:", serviceId)
    console.log("🚀 ~ assignToOfficeStaff ~ orderId:", orderId)
    console.log("==assignStaffByElora==");

    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/orders/assign-staff-by-elora/${orderId}/${serviceId}/${officeStaffId}/${workType}/${status}`, {
            orderId,
            serviceId,
            officeStaffId,
            workType,
            status

        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀  ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to assign by elora "
        );
    }
}

export const approveLeave = async (employeeId: any, leaveId: any) => {
    try {
        const token = Cookies.get('accessToken')
        console.log("🚀 ~ approveLeave ~ token:", token)
        const res = await api.post(`/leaves/approve-leave/${employeeId}/${leaveId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
        console.log("🚀 ~ approveLeave ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ createPayment ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to createPayment"
        );
    }
}
// export const rejectLeave = async (employeeId: any, leaveId: any) => {
//     try {
//         const token = Cookies.get('accessToken')
//         const res = await api.post(`/leaves/reject-leave/${employeeId}/${leaveId}`, {}, {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//             }
//         })
//         return res
//     } catch (error: any) {
//         console.error("🚀 ~ createPayment ~ error:", error);
//         throw new Error(
//             error?.response?.data?.message || "Failed to createPayment"
//         );
//     }
// }

// api.ts or wherever this function exists
export const rejectLeave = async (employeeId: string, leaveId: string, rejectionReason: string) => {
    try {
        const token = Cookies.get("accessToken");

        const res = await api.post(
            `/leaves/reject-leave/${employeeId}/${leaveId}`,
            { rejectionReason }, // ✅ send reason in body
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return res;
    } catch (error: any) {
        console.error("🚀 ~ rejectLeave ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to reject leave"
        );
    }
};

export const deleteLeave = async (leaveId: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.delete(`/leaves/delete/${leaveId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res
    } catch (error: any) {
        console.error("🚀 ~ deletePaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
}

export const getAllLeaves = async (id: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.get(`/leaves/get-all-leaves/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllLeaves ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ deletePaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
}

export const createDealer = async (data: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.post("/dealers/create-dealer", data, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        console.log("🚀 ~ createDealer ~ res:", res)
        return res

    } catch (error: any) {
        console.error("🚀 ~ deletePaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
};

export const getDealerById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/dealers/get-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getDealerById ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getEngineerByTools ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const editDealerById = async (id: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/dealers/edit-by-id/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ editDealerById ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ edit courier ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const deleteDealer = async (id: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.delete(`/dealers/delete-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ deleteDealer ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ deletePaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
}

export const assignToOfficeStaffByElora = async (orderId: string, serviceId: string, officeStaffId: string, workType: string, status: any) => {
    console.log("🚀 ~ assignToOfficeStaff ~ status:", status)
    console.log("🚀 ~ assignToOfficeStaff ~ workType:", workType)
    console.log("🚀 ~ assignToOfficeStaff ~ officeStaffId:", officeStaffId)
    console.log("🚀 ~ assignToOfficeStaff ~ serviceId:", serviceId)
    console.log("🚀 ~ assignToOfficeStaff ~ orderId:", orderId)
    console.log("==assignToOfficeStaffByElora==");

    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/orders/assign-staff-by-elora/${orderId}/${serviceId}/${officeStaffId}/${workType}/${status}`, {
            orderId,
            serviceId,
            officeStaffId,
            workType,
            status

        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀  ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch "
        );
    }
}

export const addCourierByOrderId = async (orderId: string, payload: any) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.post(`/courier/add-by-orderId/${orderId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        console.log("🚀 ~ addCourierByOrderId ~ payload:", payload)

        console.log("🚀 ~ addCourierByOrderId ~ res:", res);
        return res.data; // return data directly
    } catch (error: any) {
        console.error("🚀 ~ addCourierByOrderId ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to add courier"
        );
    }
};

export const getAllCourierDetails = async (orderId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/courier/get-all-courier/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllManufacturer ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllManufacturer ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const createManufacturer = async (data: any) => {
    try {
        const token = Cookies.get("accessToken")
        console.log("🚀 ~ createManufacturer ~ token:", token)
        const res = await api.post("/manufacturers/add", data, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        console.log("🚀 ~ createDealer ~ res:", res)
        return res

    } catch (error: any) {
        console.error("🚀 ~ createManufacturer ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
};

export const getAllManufacturer = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/manufacturers/get-all`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllManufacturer ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllManufacturer ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const getManufacturerById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/manufacturers/get-by-id/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getDealerById ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getManufacturerById ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const editManufacturerById = async (id: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/manufacturers/update-manufacturer/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ editManufacturerById ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ edit courier ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}


export const deleteManufacturer = async (id: any) => {
    try {
        const token = Cookies.get("accessToken")
        const res = await api.delete(`/manufacturers/delete-manufacturer/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ deleteDealer ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ deletePaymentById ~ error:", error)
        throw new Error(
            error?.response?.data?.message || "Failed to deletePaymentById"
        )
    }
}

export const addSalary = async (employeeId: any, payload: any) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.post(`/salary/generate/${employeeId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        return res.data; // return data directly
    } catch (error: any) {
        console.error("🚀 ~ addCourierByOrderId ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to add courier"
        );
    }
}
export const getSalaries = async (employeeId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/salary/get-salaries/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getAllManufacturer ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllManufacturer ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const updateSalary = async (id: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/salary/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ edit courier ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
export const deleteSalary = async (id: any) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.delete(`/salary/delete/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error: any) {
        console.error("🚀 deleteSalary error:", error);
        throw new Error(error?.response?.data?.message || "Failed to delete salary");
    }
};

export const getDetailsById = async (salaryId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/salary/details/${salaryId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getDetailsById ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllManufacturer ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}

export const uploadInvoice = async (orderId: string, file: File) => {
    try {
        const token = Cookies.get("accessToken");
        if (!token) throw new Error("User not authenticated");

        // Prepare FormData
        const formData = new FormData();
        formData.append("invoicePdf", file);

        // Make API call
        const response = await api.post(
            `/invoice/upload-pdf/${orderId}`, // orderId in URL
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        console.log("🚀 ~ uploadInvoice ~ response:", response)

        return response.data;
    } catch (error: any) {
        console.error("Error uploading invoice:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

export const updateTool = async (id: string, payload: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/tools/update/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ updateTool ~ error:", error);
        throw new Error(error?.response?.data?.message || "Failed to update tool");
    }
};

export const toolHistory = async (toolId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/tools/history/${toolId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ toolHistory ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllManufacturer ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch getAllManufacturerF"
        );
    }
}

export const attendanceSummary = async (empId: string, month: number, year: number) => {
    try {
        const token = Cookies.get("accessToken");

        // ✅ Pass month & year as query params
        const res = await api.get(`/technician/attendance-summary/${empId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                month,
                year,
            },
        });

        console.log("🚀 ~ attendanceSummary ~ res:", res.data);
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ attendanceSummary ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch attendance summary"
        );
    }
};


export const getPdfForAcceptQuotation = async (orderId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-pdf/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getPdfForAcceptQuotation ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getPdfForAcceptQuotation ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}


// export cons

export const editPayment = async (id: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/payment/edit-payment/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ editPayment ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to update payment"
        );
    }
};

export const getNextQuotationNumber = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/quotation/next-number`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getNextQuotationNumber ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getNextQuotationNumber ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch raw data"
        );
    }
}


export const allocateLeavesForAll = async (payload: { year: number; totalLeaves: number }) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.post(`/leaves/allocate-leaves-all`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        console.log("🚀 ~ allocateLeavesForAll ~ res:", res);
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ allocateLeavesForAll ~ error:", error);
        throw new Error(error?.response?.data?.message || "Failed to allocate leaves for all employees");
    }
};

// ✅ Get leave allocations for ALL employees (optionally by year)
export const getAllAllocatedLeaves = async (year?: number) => {
    try {
        const token = Cookies.get("accessToken");
        const query = year ? `?year=${year}` : "";
        const res = await api.get(`/leaves/leave-allocations${query}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error: any) {
        console.error("🚀 ~ getAllAllocatedLeaves ~ error:", error);
        throw new Error(error?.response?.data?.message || "Failed to fetch allocated leaves for all employees");
    }
};


export const attendenceSummary = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/leaves/attendance-summary/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ attendenceSummary ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ attendenceSummary ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to attendenceSummary"
        );
    }
}
export const getPaymentSummary = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/salary/payment-summary/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getPaymentSummary ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getPaymentSummary ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getPaymentSummary"
        );
    }
}

export const getAllStaffOrders = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/assigned-orders-for-staff`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getAllStaffOrders ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllStaffOrders ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getAllStaffOrders"
        );
    }
}

export const getAttendanceStatus = async (employeeId: string, date: string) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/attendence-status/${employeeId}?date=${date}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        return res
    } catch (error: any) {
        console.error("🚀 ~ getAttendanceStatus ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getAttendanceStatus"
        );
    }
};
export const getPaymentDetails = async (employeeId: string, date: string) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/get-payment-details/${employeeId}?date=${date}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getPaymentDetails ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getPaymentDetails ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getPaymentDetails"
        );
    }
};


export const getAllLeavesByStaff = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/leaves/get-all-leaves/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getAllLeavesByStaff ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getAllLeavesByStaff ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getAllLeavesByStaff"
        );
    }
}

export const getStaffLeaveById = async (staffId: any, leaveId: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/leaves/get-by-id/${staffId}/${leaveId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getStaffLeaveById ~ res:", res)
        console.log("🚀 ~ getStaffLeaveById ~ res:", res)
        return res
    } catch (error: any) {
        console.error("🚀 ~ getStaffLeaveById ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getStaffLeaveById"
        );
    }
}
// api/index.ts
export const editStaffLeaveById = async (staffId: string, leaveId: string, data: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/leaves/edit-leave/${staffId}/${leaveId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to edit staff leave');
    }
};


export const getAdvancedAmount = async (id: any) => {
    console.log("🚀 ~ getAdvancedAmount ~ id:", id)
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/get-advanced-amount/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getAdvancedAmount ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getAdvancedAmount ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getAdvancedAmount"
        );
    }
}

export const deleteOrder = async (id: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.delete(`/orders/delete-order/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ deleteOrder ~ error:", error);
        throw error;
    }
}
export const getWorkOrderCopy = async (orderId: any) => {
    try {
        const token = Cookies.get("accessToken");
        const res = await api.get(`/orders/get-work-order-copy/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data.data.workOrderCopy; // returns URL string
    } catch (error: any) {
        console.error("🚀 ~ getWorkOrderCopy error:", error);
        throw new Error(error?.response?.data?.message || "Failed to getWorkOrderCopy");
    }
};

export const getSummary = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/dashboard/summary`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getSummary ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getSummary ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getSummary"
        );
    }
}

export const monthlyStats = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/dashboard/monthly-stats`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getSummary ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getSummary ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getSummary"
        );
    }
}
export const employeeTrips = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/dashboard/employee-trips`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        // console.log("🚀 ~ getSummary ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getSummary ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to getSummary"
        );
    }
}

export const getUnassignedTools = async () => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/tools/unassigned-tools`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ getUnassignedTools ~ error:", error);
        throw error;
    }
}

export const getDealerOrders = async () => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/invoice/get-dealer-orders`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ getDealerOrders ~ error:", error);
        throw error;
    }
}

export const getQuotationHistory = async (id: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/quotation/get-quotation-history/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ getQuotationHistory ~ error:", error);
        throw error;
    }
}

export const getPendingLeaveApprovals = async () => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/leaves/get-pending-leave-approvals`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ getPendingLeaveApprovals ~ error:", error);
        throw error;
    }
}

export const getAllStaffEnquiries = async () => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/enquiry/all-staff-enquiries`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ getAllStaffEnquiries ~ error:", error);
        throw error;
    }
}


//service report API'S
export const getDetails = async (serviceId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/service-report/get-details/${serviceId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ getDetails ~ error:", error);
        throw error;
    }
}
export const getTools = async (serviceId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/service-report/get-tools/${serviceId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        console.error("🚀 ~ getDetails ~ error:", error);
        throw error;
    }
}




export const saveReportHeader = async (serviceId: any, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(
        `/service-report/report-header/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
// api/index.ts or wherever
export const getReportHeader = async (serviceId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/report-header/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("🚀 ~ getReportHeader ~ res:", res)
    return res.data;
};





//CT Scan
//radiation profile
export const addRadiationProfileWidth = async (serviceId: string, payload: any) => {
    console.log("🚀 ~ addRadiationProfileWidth ~ called:")

    console.log("🚀 ~ addRadiationProfileWidth ~ payload:", payload)
    console.log("🚀 ~ addRadiationProfileWidth ~ serviceId:", serviceId)
    try {
        const token = Cookies.get('accessToken');
        const res = await api.post(
            `/service-report/ct-scan/radiation-profile-width/${serviceId}`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log("🚀 ~ addRadiationProfileWidth ~ res:", res)
        return res.data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to save Radiation Profile Width');
    }
};
export const getRadiationProfileWidthByTestId = async (testId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/ct-scan/radiation-profile-width/${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("🚀 ~ getRadiationProfileWidthByTestId ~ res.data.data:", res.data.data)
    return res.data.data;
};

// UPDATE BY TEST ID
export const updateRadiationProfileWidth = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(
        `/service-report/ct-scan/radiation-profile-width/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

//MeasurementOfOperatingPotential
export const addMeasurementOfOperatingPotential = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.post(
        `/service-report/ct-scan/measurement-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};
// GET BY TEST ID
export const getMeasurementOfOperatingPotentialByTestId = async (testId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/ct-scan/measurement-of-operating-potential/${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("🚀 ~ getMeasurementOfOperatingPotentialByTestId ~ res.data.data:", res.data.data)
    return res.data.data;
};

// src/api/radiationProfileWidth.ts

export const getRadiationProfileWidthByServiceId = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/inventional-radiology/radiation-profile-width/service/${serviceId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data.data; // null if not created yet, or full object with _id
    } catch (error: any) {
        if (error.response?.status === 404 || !error.response) return null;
        console.error("Failed to load Radiation Profile Width test:", error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateMeasurementOfOperatingPotential = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(
        `/service-report/ct-scan/measurement-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

//MeasurementOfMaLinearity
export const addMeasurementOfMaLinearity = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(
            `/service-report/ct-scan/measurement-of-ma-linearity/${serviceId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('Create failed:', error);
        throw error;
    }
};

// GET BY TEST ID
export const getMeasurementOfMaLinearityByTestId = async (testId: string) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/measurement-of-ma-linearity/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ getMeasurementOfMaLinearityByTestId ~ res.data.data:", res.data.data)
        return res.data.data;
    } catch (error: any) {
        console.error('Fetch failed:', error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateMeasurementOfMaLinearity = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(
            `/service-report/ct-scan/measurement-of-ma-linearity/${testId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('Update failed:', error);
        throw error;
    }
};

//timer accyracy
// CREATE
export const addTimerAccuracy = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(
            `/service-report/ct-scan/timer-accuracy/${serviceId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('TimerAccuracy create failed:', error);
        throw error;
    }
};

// GET BY TEST ID
export const getTimerAccuracyByTestId = async (testId: string) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/timer-accuracy/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ getTimerAccuracyByTestId ~ res.data.data:", res.data.data)
        return res.data.data;
    } catch (error: any) {
        console.error('TimerAccuracy fetch failed:', error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateTimerAccuracy = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(
            `/service-report/ct-scan/timer-accuracy/${testId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('TimerAccuracy update failed:', error);
        throw error;
    }
};

//measurement of CTDI

// CREATE
export const addMeasurementOfCTDI = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(
            `/service-report/ct-scan/measurement-of-CTDI/${serviceId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('MeasurementOfCTDI create failed:', error);
        throw error;
    }
};

// GET BY TEST ID
export const getMeasurementOfCTDIByTestId = async (testId: string) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/measurement-of-CTDI/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ getMeasurementOfCTDIByTestId ~ res.data.data:", res.data.data)
        return res.data.data;
    } catch (error: any) {
        console.error('MeasurementOfCTDI fetch failed:', error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateMeasurementOfCTDI = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(
            `/service-report/ct-scan/measurement-of-CTDI/${testId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('MeasurementOfCTDI update failed:', error);
        throw error;
    }
};


//total filteration


// CREATE
export const addTotalFilteration = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(
            `/service-report/ct-scan/total-filteration/${serviceId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('TotalFilteration create failed:', error);
        throw error;
    }
};

// GET BY TEST ID
export const getTotalFilterationByTestId = async (testId: string) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/total-filteration/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ getTotalFilterationByTestId ~ res.data.data:", res.data.data)
        return res.data.data;
    } catch (error: any) {
        console.error('TotalFilteration fetch failed:', error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateTotalFilteration = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(
            `/service-report/ct-scan/total-filteration/${testId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('TotalFilteration update failed:', error);
        throw error;
    }
};

//RadiationLeakage
// CREATE
export const addRadiationLeakage = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(
            `/service-report/ct-scan/radiation-leakage/${serviceId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('RadiationLeakage create failed:', error);
        throw error;
    }
};

// GET BY TEST ID
export const getRadiationLeakageByTestId = async (testId: string) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/radiation-leakage/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ getRadiationLeakageByTestId ~ res.data:", res.data)
        return res.data.data;
    } catch (error: any) {
        console.error('RadiationLeakage fetch failed:', error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateRadiationLeakage = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(
            `/service-report/ct-scan/radiation-leakage/${testId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        console.error('RadiationLeakage update failed:', error);
        throw error;
    }
};

export const addOutputConsistency = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(
            `/service-report/ct-scan/output-consistency/${serviceId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error('OutputConsistency create failed:', error);
        throw error;
    }
};

// GET BY TEST ID
export const getOutputConsistencyByTestId = async (testId: string) => {
    console.log("🚀 ~ getOutputConsistencyByTestId ~ testId:------->", testId)
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/output-consistency/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ getOutputConsistencyByTestId ~ res.data.data:-------->", res.data.data)
        return res.data.data; // matches your backend response structure
    } catch (error: any) {
        console.error('OutputConsistency fetch failed:', error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateOutputConsistency = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(
            `/service-report/ct-scan/output-consistency/${testId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error('OutputConsistency update failed:', error);
        throw error;
    }
};


//inventional radilogy/Cath lab
//accuracy of irradiation time
export const createAccuracyOfIrradiationTime = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/inventional-radiology/accuracy-of-irradiation-time/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const getAccuracyOfIrradiationTime = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/inventional-radiology/accuracy-of-irradiation-time/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // assuming your backend returns { success: true, data: {...} }
    } catch (error: any) {
        if (error.response?.status === 404) return null; // no data yet
        throw error;
    }
};

export const updateAccuracyOfIrradiationTime = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/inventional-radiology/accuracy-of-irradiation-time/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};



//total filteration
export const createTotalFilteration = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/inventional-radiology/total-filteration/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // returns { success: true, data: { testId, serviceReportId } }
};

// GET by testId
export const getTotalFilteration = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/inventional-radiology/total-filteration/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // your backend returns { success: true, data: { ...test } }
    } catch (error: any) {
        if (error.response?.status === 404) return null; // no test yet
        throw error;
    }
};

// UPDATE by testId
export const updateTotalFilterationforInventionalRadiology = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/inventional-radiology/total-filteration/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//exposure rate at table top
export const addExposureRateTableTop = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.post(
            `/service-report/inventional-radiology/exposure-rate/${serviceId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("ExposureRateTableTop create failed:", error);
        throw error;
    }
};

// GET BY TEST ID
export const getExposureRateTableTopByTestId = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/inventional-radiology/exposure-rate/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("🚀 ~ getExposureRateTableTopByTestId ~ res:", res)
        return res.data.data;
    } catch (error: any) {
        console.error("ExposureRateTableTop fetch failed:", error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateExposureRateTableTop = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.put(
            `/service-report/inventional-radiology/exposure-rate/${testId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("ExposureRateTableTop update failed:", error);
        throw error;
    }
};