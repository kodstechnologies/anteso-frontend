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
// api.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response?.status === 401) {
//             // Token is invalid or expired
//             Cookies.remove('accessToken');
//             Cookies.remove('refreshToken');
//             // Redirect to login page
//             window.location.href = '/login';
//         }
//         return Promise.reject(error);
//     }
// );


api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Check if it's a public route
            const publicRoutes = ['/enquiry_form'];
            const currentPath = window.location.pathname;

            // Don't redirect if we're on a public route
            if (publicRoutes.includes(currentPath)) {
                return Promise.reject(error); // Just reject, don't redirect
            }

            // Token is invalid or expired - redirect only for protected routes
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Proxy file from S3/external URL to avoid CORS issues
// Uses AWS SDK on backend (same as s3Fetch.js) but streams through backend
export const proxyFile = async (fileUrl: string) => {
    try {
        const res = await api.get('/file/proxy-file', {
            params: { fileUrl },
            responseType: 'blob', // Important: get binary data
        });
        return res;
    } catch (error: any) {
        console.error("🚀 ~ proxyFile ~ error:", error);

        // If error response is a JSON blob, try to parse it
        if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
            try {
                const errorText = await error.response.data.text();
                const errorJson = JSON.parse(errorText);
                console.error("🚀 ~ proxyFile ~ error details:", errorJson);

                // Create a more informative error
                const enhancedError = new Error(errorJson.message || error.message);
                (enhancedError as any).details = errorJson.details;
                (enhancedError as any).status = error.response.status;
                throw enhancedError;
            } catch (parseError) {
                // If parsing fails, throw original error
                throw error;
            }
        }

        throw error;
    }
};

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
        const res = await api.patch(`/clients/update/${clientId}`, updatedData, {
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
        // const token = Cookies.get("accessToken");
        const res = await api.post("/auth/add", payload, {
            // headers: {
            //     Authorization: `Bearer ${token}`,
            // },
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
export const updateBasicDetailsByOrderId = async (
    orderId: string,
    data: any) => {
    try {
        const token = Cookies.get('accessToken');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await api.put(`/orders/update-details-by-orderId/${orderId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error: any) {
        console.error('Error updating basic order details:', error);

        const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to update order basic details';

        throw new Error(errorMessage);
    }
};
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
        // const token = Cookies.get('accessToken')
        const res = await api.get(`/auth/all-states`, {

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

export const getActiveTechnicians = async () => {
    try {
        const token = Cookies.get('accessToken')
        // console.log("hi from getAllTechnicianss");

        const res = await api.get('/technician/all-active-engineers', {
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
export const getActiveStaffs = async () => {
    try {
        const token = Cookies.get('accessToken')
        // console.log("hi from getAllTechnicianss");

        const res = await api.get('/technician/all-active-staffs', {
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
export const getAllActiveEmployees = async () => {
    try {
        const token = Cookies.get('accessToken')
        // console.log("hi from getAllTechnicianss");

        const res = await api.get('/technician/all-active-employees', {
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
    console.log("i m inside-- getReportHeader")
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/fixed-radio-fluro/report-header/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("🚀 ~ getReportHeader ~ res:", res)
    return res.data;
};

// export const getReportHeaderForCBCT = async (serviceId: string) => {
//     console.log("i m inside-- getReportHeader")
//     const token = Cookies.get('accessToken');
//     const res = await api.get(`/service-report/fixed-radio-fluro/report-header/${serviceId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//     });
//     console.log("🚀 ~ getReportHeader ~ res:", res)
//     return res.data;
// };






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

// GET BY SERVICE ID - Radiation Profile Width for CT Scan
export const getRadiationProfileWidthByServiceIdForCTScan = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get("accessToken");
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(
            `/service-report/ct-scan/radiation-profile-width/service/${serviceId}`,
            {
                params,
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404 || !error.response) return null;
        console.error("Failed to load Radiation Profile Width test for CT Scan:", error);
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

// GET BY SERVICE ID
export const getOutputConsistencyByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/output-consistency/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('OutputConsistency getByServiceId failed:', error);
        throw error;
    }
};

// GET BY SERVICE ID - Measurement of Operating Potential
export const getMeasurementOfOperatingPotentialByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/measurement-of-operating-potential/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getMeasurementOfOperatingPotentialByServiceId failed:', error);
        throw error;
    }
};

// GET BY SERVICE ID - Timer Accuracy
export const getTimerAccuracyByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/timer-accuracy/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getTimerAccuracyByServiceId failed:', error);
        throw error;
    }
};

// GET BY SERVICE ID - Measurement of CTDI
export const getMeasurementOfCTDIByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/measurement-of-CTDI/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getMeasurementOfCTDIByServiceId failed:', error);
        throw error;
    }
};

// GET BY SERVICE ID - Total Filtration
export const getTotalFilterationByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/total-filteration/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getTotalFilterationByServiceId failed:', error);
        throw error;
    }
};

// GET BY SERVICE ID - Measurement of mA Linearity
export const getMeasurementOfMaLinearityByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/measurement-of-ma-linearity/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getMeasurementOfMaLinearityByServiceId failed:', error);
        throw error;
    }
};

// GET BY SERVICE ID - Radiation Leakage
export const getRadiationLeakageByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/radiation-leakage/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getRadiationLeakageByServiceId failed:', error);
        throw error;
    }
};

// Measure Max Radiation Level for CT Scan
export const createMeasureMaxRadiationLevelForCTScan = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(`/service-report/ct-scan/measure-max-radiation-level/${serviceId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        console.error('createMeasureMaxRadiationLevelForCTScan failed:', error);
        throw error;
    }
};

export const getMeasureMaxRadiationLevelForCTScan = async (testId: string) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/measure-max-radiation-level/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getMeasureMaxRadiationLevelForCTScan failed:', error);
        throw error;
    }
};

// GET BY SERVICE ID - Measure Max Radiation Level
export const getMeasureMaxRadiationLevelByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/measure-max-radiation-level/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getMeasureMaxRadiationLevelByServiceId failed:', error);
        throw error;
    }
};

export const updateMeasureMaxRadiationLevelForCTScan = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(`/service-report/ct-scan/measure-max-radiation-level/${testId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        console.error('updateMeasureMaxRadiationLevelForCTScan failed:', error);
        throw error;
    }
};

// GET BY SERVICE ID - Low Contrast Resolution
export const getLowContrastResolutionByServiceIdForCTScan = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/low-contrast-resolution/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getLowContrastResolutionByServiceIdForCTScan failed:', error);
        throw error;
    }
};

// Get Report Header for CT Scan
export const getReportHeaderForCTScan = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get("accessToken");
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/report-header/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching CT Scan report:", error);
        throw error;
    }
};

// High Contrast Resolution for CT Scan
export const createHighContrastResolutionForCTScan = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(`/service-report/ct-scan/high-contrast-resolution/${serviceId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        console.error('createHighContrastResolutionForCTScan failed:', error);
        throw error;
    }
};

export const getHighContrastResolutionForCTScan = async (testId: string) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/high-contrast-resolution/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getHighContrastResolutionForCTScan failed:', error);
        throw error;
    }
};

export const getHighContrastResolutionByServiceIdForCTScan = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/ct-scan/high-contrast-resolution/service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getHighContrastResolutionByServiceIdForCTScan failed:', error);
        throw error;
    }
};

export const updateHighContrastResolutionForCTScan = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(`/service-report/ct-scan/high-contrast-resolution/${testId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        console.error('updateHighContrastResolutionForCTScan failed:', error);
        throw error;
    }
};

// Low Contrast Resolution for CT Scan
export const createLowContrastResolutionForCTScan = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.post(`/service-report/ct-scan/low-contrast-resolution/${serviceId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        console.error('createLowContrastResolutionForCTScan failed:', error);
        throw error;
    }
};

export const getLowContrastResolutionForCTScan = async (testId: string) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.get(`/service-report/ct-scan/low-contrast-resolution/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error('getLowContrastResolutionForCTScan failed:', error);
        throw error;
    }
};

export const updateLowContrastResolutionForCTScan = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    try {
        const res = await api.put(`/service-report/ct-scan/low-contrast-resolution/${testId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        console.error('updateLowContrastResolutionForCTScan failed:', error);
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

export const getAccuracyOfIrradiationTimeByServiceId = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get("accessToken");
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/inventional-radiology/accuracy-of-irradiation-time-by-service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data?.data || null;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getAccuracyOfIrradiationTimeByServiceId failed:", error);
        throw error;
    }
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

// GET by serviceId
export const getTotalFilterationByServiceIdForInventionalRadiology = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get("accessToken");
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/inventional-radiology/total-filteration-by-service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data?.data || null;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getTotalFilterationByServiceIdForInventionalRadiology failed:", error);
        throw error;
    }
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

// GET BY SERVICE ID
export const getExposureRateTableTopByServiceIdForInventionalRadiology = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get("accessToken");
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/inventional-radiology/exposure-rate-by-service/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data?.data || null;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getExposureRateTableTopByServiceIdForInventionalRadiology failed:", error);
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

// ========================================================================
// Fixed Radio Fluoro – APIs
// ========================================================================

// Accuracy of Operating Potential – Fixed Radio Fluoro
export const addAccuracyOfOperatingPotentialForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/accuracy-of-operating-potential-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForFixedRadioFluro = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/fixed-radio-fluro/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Total Filtration – Fixed Radio Fluoro
export const addTotalFiltrationForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/total-filteration/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTotalFiltrationByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/total-filteration-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getTotalFiltrationByTestIdForFixedRadioFluro = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/fixed-radio-fluro/total-filteration/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTotalFiltrationForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/total-filteration/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Output Consistency – Fixed Radio Fluoro
export const addOutputConsistencyForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/output-consistency/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getOutputConsistencyByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/output-consistency-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getOutputConsistencyByTestIdForFixedRadioFluro = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/fixed-radio-fluro/output-consistency/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateOutputConsistencyForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/output-consistency/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Exposure Rate – Fixed Radio Fluoro
export const addExposureRateTableTopForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/exposure-rate/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getExposureRateTableTopByTestIdForFixedRadioFluro = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/fixed-radio-fluro/exposure-rate/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateExposureRateTableTopForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/exposure-rate/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Irradiation Time – Fixed Radio Fluoro
export const createAccuracyOfIrradiationTimeForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/accuracy-of-irradiation-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateAccuracyOfIrradiationTimeForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading Stations – Fixed Radio Fluoro
export const addLinearityOfMasLoadingStationsForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");

    const res = await api.post(
        `/service-report/fixed-radio-fluro/linearity-of-mas-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingStationsByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/linearity-of-mas-loading-stations-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingStationsByTestIdForFixedRadioFluro = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/fixed-radio-fluro/linearity-of-mas-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingStationsForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    console.log(testId);

    const res = await api.put(
        `/service-report/fixed-radio-fluro/linearity-of-mas-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading – Fixed Radio Fluoro
export const addLinearityOfMasLoadingForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/linearity-of-mas-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/linearity-of-mas-loading-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateLinearityOfMasLoadingForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/linearity-of-mas-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Central Beam Alignment – Fixed Radio Fluoro
export const addCentralBeamAlignmentForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/central-beam-alignment/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCentralBeamAlignmentByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/central-beam-alignment-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateCentralBeamAlignmentForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/central-beam-alignment/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Congruence – Fixed Radio Fluoro
export const addCongruenceForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/congruence/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCongruenceByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/congruence-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateCongruenceForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/congruence/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Effective Focal Spot – Fixed Radio Fluoro
export const addEffectiveFocalSpotForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/effective-focal-spot/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getEffectiveFocalSpotByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/effective-focal-spot-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateEffectiveFocalSpotForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/effective-focal-spot/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Protection Survey – Fixed Radio Fluoro
export const addRadiationProtectionSurveyForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/radiation-protection-survey-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateRadiationProtectionSurveyForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// High Contrast Resolution – Fixed Radio Fluoro
export const addHighContrastResolutionForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/high-contrast-resolution/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getHighContrastResolutionByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/high-contrast-resolution-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getHighContrastResolutionByTestIdForFixedRadioFluro = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/fixed-radio-fluro/high-contrast-resolution/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateHighContrastResolutionForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/high-contrast-resolution/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Low Contrast Resolution – Fixed Radio Fluoro
export const addLowContrastResolutionForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/low-contrast-resolution/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLowContrastResolutionByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/low-contrast-resolution-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLowContrastResolutionByTestIdForFixedRadioFluro = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/fixed-radio-fluro/low-contrast-resolution/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLowContrastResolutionForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/low-contrast-resolution/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};


//mammography
export const addAccuracyOfOperatingPotentialForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.post(
            `/service-report/mammography/accuracy-of-operating-potential/${serviceId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("AccuracyOfOperatingPotentialForMammography create failed:", error);
        throw error;
    }
};

// GET BY SERVICE ID (preferred — returns null if not created)
export const getAccuracyOfOperatingPotentialByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    console.log("inside getAccuracyOfOperatingPotentialByServiceIdForMammography")
    try {
        const res = await api.get(
            `/service-report/mammography/accuracy-of-operating-potential-by-serviceId/${serviceId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        console.log("🚀 ~ getAccuracyOfOperatingPotentialByServiceIdForMammography ~ res:", res)
        return res.data.data; // null on first visit
    } catch (error: any) {
        if (error.response?.status === 404 || !error.response) return null;
        console.error("AccuracyOfOperatingPotential fetch by serviceId failed:", error);
        throw error;
    }
};

// GET BY TEST ID (legacy support)
export const getAccuracyOfOperatingPotentialByTestIdForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/mammography/accuracy-of-operating-potential/${testId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data.data;
    } catch (error: any) {
        console.error("AccuracyOfOperatingPotential fetch by testId failed:", error);
        throw error;
    }
};

// UPDATE BY TEST ID (legacy)
export const updateAccuracyOfOperatingPotentialForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.put(
            `/service-report/mammography/accuracy-of-operating-potential/${testId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("AccuracyOfOperatingPotentialForMammography update failed:", error);
        throw error;
    }
};

// Accuracy of Irradiation Time for Mammography
export const addAccuracyOfIrradiationTimeForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/mammography/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/mammography/accuracy-of-irradiation-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/mammography/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/mammography/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mA Loading Stations for Mammography
export const addLinearityOfMasLoadingStationsForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/mammography/linearity-of-mas-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingStationsByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/mammography/linearity-of-mas-loading-stations-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingStationsByTestIdForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/mammography/linearity-of-mas-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingStationsForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/mammography/linearity-of-mas-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

//Linearity of mAs Loading
export const addLinearityOfMasLLoadingForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.post(
            `/service-report/mammography/linearity-of-mas-loading/${serviceId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("LinearityOfMasLLoading create/update failed:", error);
        throw error;
    }
};

// GET BY SERVICE ID (preferred — returns null if not created yet)
export const getLinearityOfMasLLoadingByServiceIdForMammography = async (serviceId: string) => {
    console.log("🚀 ~ getLinearityOfMasLLoadingByServiceIdForMammography ~ serviceId:", serviceId)
    console.log("inside 🚀 ~ getLinearityOfMasLLoadingByServiceIdForMammography :")
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/mammography/linearity-of-mas-loading-by-service/${serviceId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data.data; // will be null on first visit
    } catch (error: any) {
        if (error.response?.status === 404 || !error.response) return null;
        console.error("LinearityOfMasLLoading fetch by serviceId failed:", error);
        throw error;
    }
};

// GET BY TEST ID (legacy support)
export const getLinearityOfMasLLoadingByTestIdForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/mammography/linearity-of-mas-loading/${testId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data.data;
    } catch (error: any) {
        console.error("LinearityOfMasLLoading fetch by testId failed:", error);
        throw error;
    }
};

// UPDATE BY TEST ID (legacy)
export const updateLinearityOfMasLLoadingForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.put(
            `/service-report/mammography/linearity-of-mas-loading/${testId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("LinearityOfMasLLoading update failed:", error);
        throw error;
    }
};

//totalFilteration
export const addTotalFilterationForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.post(
            `/service-report/mammography/total-filteration/${serviceId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data; // { success: true, data: {...} }
    } catch (error: any) {
        console.error("Total Filteration create failed:", error);
        throw error;
    }
};

// GET BY SERVICE ID → returns null if not created yet (first visit)
export const getTotalFilterationByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/mammography/total-filteration-by-serviceId/${serviceId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data.data; // will be object or undefined → we return null
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null; // First time user visits → no data yet
        }
        console.error("Total Filteration fetch by serviceId failed:", error);
        throw error;
    }
};

// GET BY TEST ID (legacy — rarely used)
export const getTotalFilterationByTestIdForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/mammography/total-filteration/${testId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data.data;
    } catch (error: any) {
        console.error("Total Filteration fetch by testId failed:", error);
        throw error;
    }
};

// UPDATE BY TEST ID
export const updateTotalFilterationForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.put(
            `/service-report/mammography/total-filteration/${testId}`,
            payload,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("Total Filteration update failed:", error);
        throw error;
    }
};


//reproducibility of irradiation out put
export const addReproducibilityOfOutputForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/mammography/reproducubility-of-irradiation-output/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const getReproducibilityOfOutputByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/reproducubility-of-irradiation-output-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateReproducibilityOfOutputForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/mammography/reproducubility-of-irradiation-output/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};
export const getReproducibilityOfOutputForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/mammography/reproducubility-of-irradiation-output/${testId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return res.data.data;
    } catch (error: any) {
        console.error("getReproducibilityOfOutputForMammography testId failed:", error);
        throw error;
    }
};

//radiation leakage level
export const addRadiationLeakageLevelForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/mammography/radiation-leakage-level/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by serviceId (returns null if not found)
export const getRadiationLeakageLevelByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/radiation-leakage-level-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

// READ - Get by testId
export const getRadiationLeakageLevelForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/radiation-leakage-level/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getRadiationLeakageLevelForMammography failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateRadiationLeakageLevelForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/mammography/radiation-leakage-level/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};


//imaging phantom
export const addImagingPhantomForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/mammography/imaging-phantom/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by serviceId (returns null if not found)
export const getImagingPhantomByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/imaging-phantom-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

// READ - Get by testId
export const getImagingPhantomForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/imaging-phantom/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getImagingPhantomForMammography failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateImagingPhantomForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/mammography/imaging-phantom/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//radiation protection survey
export const addRadiationProtectionSurveyForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/mammography/radiation-protection-survey/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by serviceId (returns null if not found - matches your pattern)
export const getRadiationProtectionSurveyByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/radiation-protection-survey-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

// READ - Get by testId (legacy support)
export const getRadiationProtectionSurveyForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/radiation-protection-survey/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getRadiationProtectionSurveyForMammography failed:", error);
        throw error;
    }
};

// UPDATE - Update existing survey
export const updateRadiationProtectionSurveyForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/mammography/radiation-protection-survey/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};
export const addEquipmentSettingForMammography = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/mammography/equipment-setting/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by serviceId (returns null if not found - matches your pattern)
export const getEquipmentSettingByServiceIdForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/equipment-setting-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

// READ - Get by testId (legacy support)
export const getEquipmentSettingForMammography = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/equipment-setting/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getEquipmentSettingForMammography failed:", error);
        throw error;
    }
};

// UPDATE - Update existing equipment setting
export const updateEquipmentSettingForMammography = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/mammography/equipment-setting/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};



//CArm
export const getReportHeaderForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching C-Arm report:", error);
        throw error;
    }
};

//Interventional Radiology
export const getReportHeaderForInventionalRadiology = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get("accessToken");
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(`/service-report/inventional-radiology/report-header/${serviceId}`, {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching Interventional Radiology report:", error);
        throw error;
    }
};

// Accuracy of Irradiation Time - C-Arm
export const createAccuracyOfIrradiationTimeForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/c-arm/accuracy-of-irradiation-time/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const getAccuracyOfIrradiationTimeForCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/accuracy-of-irradiation-time/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data?.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        console.error("getAccuracyOfIrradiationTimeForCArm failed:", error);
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByServiceIdForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/accuracy-of-irradiation-time-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data?.data || null;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getAccuracyOfIrradiationTimeByServiceIdForCArm failed:", error);
        throw error;
    }
};

export const updateAccuracyOfIrradiationTimeForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/c-arm/accuracy-of-irradiation-time/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const createTotalFilterationForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/c-arm/total-filteration/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (main way when editing existing test)
export const getTotalFilterationForCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/total-filteration/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getTotalFilterationForCArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — ideal for first load)
export const getTotalFilterationByServiceIdForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/total-filteration-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // returns null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getTotalFilterationByServiceIdForCArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateTotalFilterationForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/c-arm/total-filteration/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Linearity of mAs Loading Stations - C-Arm
export const addLinearityOfMasLoadingStationsForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/c-arm/linearity-of-mas-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingStationsByServiceIdForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/c-arm/linearity-of-mas-loading-stations-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { data: null };
        throw error;
    }
};

export const getLinearityOfMasLoadingStationsByTestIdForCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/c-arm/linearity-of-mas-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingStationsForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/c-arm/linearity-of-mas-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mA Loading Stations - C-Arm
export const addLinearityOfMaLoadingStationsForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/c-arm/linearity-of-ma-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMaLoadingStationsByServiceIdForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/c-arm/linearity-of-ma-loading-stations-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { data: null };
        throw error;
    }
};

export const getLinearityOfMaLoadingStationsByTestIdForCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/c-arm/linearity-of-ma-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMaLoadingStationsForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/c-arm/linearity-of-ma-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};


//output consistency
export const createOutputConsistencyForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/c-arm/output-consistency/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (used when editing existing test)
export const getOutputConsistencyForCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/output-consistency/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getOutputConsistencyForCArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — perfect for first load)
export const getOutputConsistencyByServiceIdForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/output-consistency-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // will be null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getOutputConsistencyByServiceIdForCArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateOutputConsistencyForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/c-arm/output-consistency/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//high contrast resolution
export const createHighContrastResolutionForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/c-arm/high-contrast-resolution/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (main way when editing existing test)
export const getHighContrastResolutionForCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/high-contrast-resolution/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getHighContrastResolutionForCArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — ideal for first load)
export const getHighContrastResolutionByServiceIdForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/high-contrast-resolution-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // returns null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getHighContrastResolutionByServiceIdForCArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateHighContrastResolutionForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/c-arm/high-contrast-resolution/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//Low Contrast Resolution
export const createLowContrastResolutionForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/c-arm/low-contrast-resolution/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (used when editing existing test)
export const getLowContrastResolutionForCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/low-contrast-resolution/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getLowContrastResolutionForCArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — perfect for first load)
export const getLowContrastResolutionByServiceIdForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/low-contrast-resolution-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // will be null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getLowContrastResolutionByServiceIdForCArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateLowContrastResolutionForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/c-arm/low-contrast-resolution/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//exposure rate
export const createExposureRateForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/c-arm/exposure-rate/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (used when editing existing test)
export const getExposureRateForCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/exposure-rate/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getExposureRateForCArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — perfect for first load)
export const getExposureRateByServiceIdForCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/exposure-rate-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // will be null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getExposureRateByServiceIdForCArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateExposureRateForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/c-arm/exposure-rate/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};
export const createTubeHousingLeakageForCArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/c-arm/tube-housing/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (when opening existing saved test)
export const getTubeHousingLeakageByIdCArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/tube-housing/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getTubeHousingLeakageById failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — perfect for first load)
export const getTubeHousingLeakageByServiceIdCArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/c-arm/tube-housing-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // will be null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getTubeHousingLeakageByServiceId failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateTubeHousingLeakageForCArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/c-arm/tube-housing/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//O-Arm
export const getReportHeaderForOArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching O-Arm report:", error);
        throw error;
    }
};

export const createTotalFilterationForOArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/o-arm/total-filteration/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (main way when editing existing test)
export const getTotalFilterationForOArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/total-filteration/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getTotalFilterationForOArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — ideal for first load)
export const getTotalFilterationByServiceIdForOArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/total-filteration-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // returns null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getTotalFilterationByServiceIdForOArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateTotalFilterationForOArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/o-arm/total-filteration/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//output consistency
export const createOutputConsistencyForOArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/o-arm/output-consistency/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (used when editing existing test)
export const getOutputConsistencyForOArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/output-consistency/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getOutputConsistencyForOArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — perfect for first load)
export const getOutputConsistencyByServiceIdForOArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/output-consistency-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // will be null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getOutputConsistencyByServiceIdForOArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateOutputConsistencyForOArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/o-arm/output-consistency/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//high contrast resolution
export const createHighContrastResolutionForOArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/o-arm/high-contrast-resolution/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (main way when editing existing test)
export const getHighContrastResolutionForOArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/high-contrast-resolution/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getHighContrastResolutionForOArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — ideal for first load)
export const getHighContrastResolutionByServiceIdForOArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/high-contrast-resolution-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // returns null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getHighContrastResolutionByServiceIdForOArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateHighContrastResolutionForOArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/o-arm/high-contrast-resolution/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//Low Contrast Resolution
export const createLowContrastResolutionForOArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/o-arm/low-contrast-resolution/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (used when editing existing test)
export const getLowContrastResolutionForOArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/low-contrast-resolution/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getLowContrastResolutionForOArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — perfect for first load)
export const getLowContrastResolutionByServiceIdForOArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/low-contrast-resolution-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // will be null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getLowContrastResolutionByServiceIdForOArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateLowContrastResolutionForOArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/o-arm/low-contrast-resolution/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

//exposure rate
export const createExposureRateForOArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/o-arm/exposure-rate/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (used when editing existing test)
export const getExposureRateForOArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/exposure-rate/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getExposureRateForOArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — perfect for first load)
export const getExposureRateByServiceIdForOArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/exposure-rate-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // will be null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getExposureRateByServiceIdForOArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateExposureRateForOArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/o-arm/exposure-rate/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const createTubeHousingLeakageForOArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/o-arm/tube-housing/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId (when opening existing saved test)
export const getTubeHousingLeakageByIdForOArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/tube-housing/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getTubeHousingLeakageByIdForOArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId (returns null if not created yet — perfect for first load)
export const getTubeHousingLeakageByServiceIdForOArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/tube-housing-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data; // will be null if no test exists
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getTubeHousingLeakageByServiceIdForOArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateTubeHousingLeakageForOArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/o-arm/tube-housing/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Linearity of mAs Loading Station
export const createLinearityOfMasLoadingStationForOArm = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(`/service-report/o-arm/linearity-of-mas-loading-station/${serviceId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// READ - Get by testId
export const getLinearityOfMasLoadingStationForOArm = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/linearity-of-mas-loading-station/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data;
    } catch (error: any) {
        console.error("getLinearityOfMasLoadingStationForOArm failed:", error);
        throw error;
    }
};

// READ - Get by serviceId
export const getLinearityOfMasLoadingStationByServiceIdForOArm = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/o-arm/linearity-of-mas-loading-station-by-service/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.data || null;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.data?.data === null) {
            return null;
        }
        console.error("getLinearityOfMasLoadingStationByServiceIdForOArm failed:", error);
        throw error;
    }
};

// UPDATE - Update existing test
export const updateLinearityOfMasLoadingStationForOArm = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(`/service-report/o-arm/linearity-of-mas-loading-station/${testId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// Tube Housing Leakage – Fixed Radio Fluoro
export const addTubeHousingLeakageForFixedRadioFluro = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/fixed-radio-fluro/tube-housing/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTubeHousingLeakageByServiceIdForFixedRadioFluro = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/fixed-radio-fluro/tube-housing-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getTubeHousingLeakageByTestIdForFixedRadioFluro = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/fixed-radio-fluro/tube-housing/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTubeHousingLeakageForFixedRadioFluro = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/fixed-radio-fluro/tube-housing/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

//BMD MACHINE

// === 1. Accuracy of Operating Potential and Time ===
export const addAccuracyOfOperatingPotentialAndTimeForBMD = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/bmd/accuracy-of-operating-potential-and-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialAndTimeByServiceIdForBMD = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/bmd/accuracy-of-operating-potential-and-time-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

//BMD HEADER
export const getReportHeaderForBMD = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/bmd/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const saveReportHeaderForBMD = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/report-header/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Irradiation Time - BMD
export const addAccuracyOfIrradiationTimeForBMD = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/bmd/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForBMD = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/bmd/accuracy-of-irradiation-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForBMD = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/bmd/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForBMD = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - BMD
export const addAccuracyOfOperatingPotentialForBMD = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/bmd/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForBMD = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/bmd/accuracy-of-operating-potential-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForBMD = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/bmd/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForBMD = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Total Filtration - BMD
export const addTotalFiltrationForBMD = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/bmd/total-filtration/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTotalFiltrationByServiceIdForBMD = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/bmd/total-filtration-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { success: true, data: null };
        throw error;
    }
};

export const getTotalFiltrationByTestIdForBMD = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/bmd/total-filtration/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTotalFiltrationForBMD = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/total-filtration/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialAndTimeByTestIdForBMD = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/bmd/accuracy-of-operating-potential-and-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialAndTimeForBMD = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/accuracy-of-operating-potential-and-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// === 2. Linearity of mAs Loading ===
export const addLinearityOfMaLoadingForBMD = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/bmd/linearity-of-mas-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMaLoadingByServiceIdForBMD = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/bmd/linearity-of-mas-loading-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMaLoadingByTestIdForBMD = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/bmd/linearity-of-mas-loading/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMaLoadingForBMD = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/linearity-of-mas-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// === 3. Radiation Leakage Level (Tube Housing Leakage) ===
export const addRadiationLeakageLevelForBMD = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/bmd/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForBMD = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/bmd/radiation-leakage-level-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForBMD = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/bmd/radiation-leakage-level/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationLeakageLevelForBMD = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// === 4. Radiation Protection Survey ===
export const addRadiationProtectionSurveyForBmd = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/bmd/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForBmd = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/bmd/radiation-protection-survey-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationProtectionSurveyByTestIdForBmd = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/bmd/radiation-protection-survey/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationProtectionSurveyForBmd = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// === 5. Reproducibility of Radiation Output ===
export const addReproducibilityOfRadiationOutputForBmd = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/bmd/reproducibility-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getReproducibilityOfRadiationOutputByServiceIdForBmd = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/bmd/reproducibility-of-radiation-output-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getReproducibilityOfRadiationOutputByTestIdForBmd = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/bmd/reproducibility-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateReproducibilityOfRadiationOutputForBMD = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/bmd/reproducibility-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// ==================== Dental Cone Beam CT APIs ====================

// Accuracy of Irradiation Time - CBCT
export const addAccuracyOfIrradiationTimeForCBCT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-cone-beam-ct/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForCBCT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-cone-beam-ct/accuracy-of-irradiation-time-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForCBCT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-cone-beam-ct/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForCBCT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-cone-beam-ct/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - CBCT
export const addAccuracyOfOperatingPotentialForCBCT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-cone-beam-ct/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForCBCT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-cone-beam-ct/accuracy-of-operating-potential-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForCBCT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-cone-beam-ct/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForCBCT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-cone-beam-ct/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Consistency of Radiation Output - CBCT
export const addConsistencyOfRadiationOutputForCBCT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-cone-beam-ct/consistency-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getConsistencyOfRadiationOutputByServiceIdForCBCT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-cone-beam-ct/consistency-of-radiation-output-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getConsistencyOfRadiationOutputByTestIdForCBCT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-cone-beam-ct/consistency-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateConsistencyOfRadiationOutputForCBCT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-cone-beam-ct/consistency-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mA Loading - CBCT
export const addLinearityOfMaLoadingForCBCT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-cone-beam-ct/linearity-of-ma-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMaLoadingByServiceIdForCBCT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-cone-beam-ct/linearity-of-ma-loading-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMaLoadingByTestIdForCBCT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-cone-beam-ct/linearity-of-ma-loading/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMaLoadingForCBCT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-cone-beam-ct/linearity-of-ma-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Leakage Level - CBCT
export const addRadiationLeakageLevelForCBCT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-cone-beam-ct/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForCBCT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-cone-beam-ct/radiation-leakage-level-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForCBCT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-cone-beam-ct/radiation-leakage-level/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationLeakageLevelForCBCT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-cone-beam-ct/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// DentalIntra - Radiation Leakage Level
export const addRadiationLeakageLevelForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/radiation-leakage-level-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/radiation-leakage-level/${testId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateRadiationLeakageLevelForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// DentalHandHeld - Radiation Leakage Level
export const addRadiationLeakageLevelForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/radiation-leakage-level-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForDentalHandHeld = async (testId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/radiation-leakage-level/${testId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateRadiationLeakageLevelForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Protection Survey - CBCT
export const addRadiationProtectionSurveyForCBCT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-cone-beam-ct/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForCBCT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-cone-beam-ct/radiation-protection-survey-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationProtectionSurveyByTestIdForCBCT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-cone-beam-ct/radiation-protection-survey/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationProtectionSurveyForCBCT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-cone-beam-ct/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Protection Survey - CTScan
export const addRadiationProtectionSurveyForCTScan = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/ct-scan/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForCTScan = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get("accessToken");
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(
            `/service-report/ct-scan/radiation-protection-survey-by-serviceId/${serviceId}`,
            { params, headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationProtectionSurveyByTestIdForCTScan = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/ct-scan/radiation-protection-survey/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationProtectionSurveyForCTScan = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/ct-scan/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading - CTScan
export const addLinearityOfMasLoadingForCTScan = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/ct-scan/linearity-of-mas-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingByServiceIdForCTScan = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get("accessToken");
    try {
        const params: any = {};
        if (tubeId !== undefined) {
            params.tubeId = tubeId === null ? 'null' : tubeId;
        }
        const res = await api.get(
            `/service-report/ct-scan/linearity-of-mas-loading-by-serviceId/${serviceId}`,
            { params, headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingByTestIdForCTScan = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/ct-scan/linearity-of-mas-loading/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingForCTScan = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/ct-scan/linearity-of-mas-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Alignment of Table/Gantry - CTScan
export const addAlignmentOfTableGantryForCTScan = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/ct-scan/alignment-of-table-gantry/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAlignmentOfTableGantryByServiceIdForCTScan = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/ct-scan/alignment-of-table-gantry-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAlignmentOfTableGantryByTestIdForCTScan = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/ct-scan/alignment-of-table-gantry/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAlignmentOfTableGantryForCTScan = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/ct-scan/alignment-of-table-gantry/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Table Position - CTScan
export const addTablePositionForCTScan = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/ct-scan/table-position/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTablePositionByServiceIdForCTScan = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/ct-scan/table-position-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getTablePositionByTestIdForCTScan = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/ct-scan/table-position/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTablePositionForCTScan = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/ct-scan/table-position/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Gantry Tilt - CTScan
export const addGantryTiltForCTScan = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/ct-scan/gantry-tilt/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getGantryTiltByServiceIdForCTScan = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/ct-scan/gantry-tilt-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getGantryTiltByTestIdForCTScan = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/ct-scan/gantry-tilt/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateGantryTiltForCTScan = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/ct-scan/gantry-tilt/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Get Report Header for CBCT
export const getReportHeaderForCBCT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/dental-cone-beam-ct/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

// ==================== OPG APIs ====================

// Accuracy of Irradiation Time - OPG
export const addAccuracyOfIrradiationTimeForOPG = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/opg/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForOPG = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/opg/accuracy-of-irradiation-time-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForOPG = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/opg/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForOPG = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/opg/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - OPG
export const addAccuracyOfOperatingPotentialForOPG = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/opg/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForOPG = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/opg/accuracy-of-operating-potential-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForOPG = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/opg/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForOPG = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/opg/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Consistency of Radiation Output - OPG
export const addConsistencyOfRadiationOutputForOPG = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/opg/consistency-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getConsistencyOfRadiationOutputByServiceIdForOPG = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/opg/consistency-of-radiation-output-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getConsistencyOfRadiationOutputByTestIdForOPG = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/opg/consistency-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateConsistencyOfRadiationOutputForOPG = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/opg/consistency-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mA Loading - OPG
export const addLinearityOfMaLoadingForOPG = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/opg/linearity-of-ma-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMaLoadingByServiceIdForOPG = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/opg/linearity-of-ma-loading-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMaLoadingByTestIdForOPG = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/opg/linearity-of-ma-loading/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMaLoadingForOPG = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/opg/linearity-of-ma-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Leakage Level - OPG
export const addRadiationLeakageLevelForOPG = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/opg/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForOPG = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/opg/radiation-leakage-level-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForOPG = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/opg/radiation-leakage-level/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationLeakageLevelForOPG = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/opg/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Protection Survey - OPG
export const addRadiationProtectionSurveyForOPG = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/opg/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForOPG = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/opg/radiation-protection-survey-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationProtectionSurveyByTestIdForOPG = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/opg/radiation-protection-survey/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationProtectionSurveyForOPG = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/opg/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Get Report Header for OPG
export const getReportHeaderForOPG = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/opg/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

// Get Report Header for Dental Intra
// src/api/reportHeaders.ts
// your axios instance

export const getReportHeaderForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/dental-intra/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data; // This returns { exists: true, data: { ...all fields } }
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching Dental Intra report:", error);
        throw error;
    }
};

// ==================== Dental Intra APIs ====================

// Accuracy of Operating Potential and Time - Dental Intra
export const addAccuracyOfOperatingPotentialAndTimeForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/accuracy-of-operating-potential-and-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/accuracy-of-operating-potential-and-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialAndTimeByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/accuracy-of-operating-potential-and-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialAndTimeForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/accuracy-of-operating-potential-and-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of Time - Dental Intra
export const addLinearityOfTimeForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/linearity-of-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfTimeByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/linearity-of-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfTimeByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/linearity-of-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfTimeForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/linearity-of-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Reproducibility of Radiation Output - Dental Intra
export const addReproducibilityOfRadiationOutputForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/reproducibility-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getReproducibilityOfRadiationOutputByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/reproducibility-of-radiation-output-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getReproducibilityOfRadiationOutputByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/reproducibility-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateReproducibilityOfRadiationOutputForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/reproducibility-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Tube Housing Leakage - Dental Intra
export const addTubeHousingLeakageForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/tube-housing-leakage/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTubeHousingLeakageByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/tube-housing-leakage-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getTubeHousingLeakageByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/tube-housing-leakage/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTubeHousingLeakageForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/tube-housing-leakage/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - Dental Intra (separate from Time)
export const addAccuracyOfOperatingPotentialForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/accuracy-of-operating-potential-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Irradiation Time - Dental Intra (separate from Operating Potential)
export const addAccuracyOfIrradiationTimeForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/accuracy-of-irradiation-time-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Total Filtration - Dental Intra
export const addTotalFiltrationForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/total-filtration/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTotalFiltrationByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/total-filtration-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getTotalFiltrationByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/total-filtration/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTotalFiltrationForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/total-filtration/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mA Loading - Dental Intra
export const addLinearityOfMaLoadingForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/linearity-of-ma-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMaLoadingByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/linearity-of-ma-loading-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMaLoadingByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/linearity-of-ma-loading/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMaLoadingForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/linearity-of-ma-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading - Dental Intra
export const addLinearityOfMasLoadingForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/linearity-of-mas-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/linearity-of-mas-loading-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/linearity-of-mas-loading/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/linearity-of-mas-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Consistency of Radiation Output - Dental Intra (rename from Reproducibility)
export const addConsistencyOfRadiationOutputForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/consistency-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getConsistencyOfRadiationOutputByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/consistency-of-radiation-output-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getConsistencyOfRadiationOutputByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/consistency-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateConsistencyOfRadiationOutputForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/consistency-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Details of Radiation Protection Survey - Dental Intra
export const addRadiationProtectionSurveyForDentalIntra = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-intra/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForDentalIntra = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-intra/radiation-protection-survey-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationProtectionSurveyByTestIdForDentalIntra = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-intra/radiation-protection-survey/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationProtectionSurveyForDentalIntra = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-intra/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// ==================== Dental Hand-held APIs ====================

export const getReportHeaderForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/dental-hand-held/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data; // This returns { exists: true, data: { ...all fields } }
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching Dental Hand-held report:", error);
        throw error;
    }
};

export const saveReportHeaderForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/report-header/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - Dental Hand-held
export const addAccuracyOfOperatingPotentialForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/accuracy-of-operating-potential-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateAccuracyOfOperatingPotentialForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Irradiation Time - Dental Hand-held
export const addAccuracyOfIrradiationTimeForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/accuracy-of-irradiation-time-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateAccuracyOfIrradiationTimeForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential and Time - Dental Hand-held (Legacy Combined)
export const addAccuracyOfOperatingPotentialAndTimeForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/accuracy-of-operating-potential-and-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialAndTimeByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/accuracy-of-operating-potential-and-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialAndTimeByTestIdForDentalHandHeld = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-hand-held/accuracy-of-operating-potential-and-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialAndTimeForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/accuracy-of-operating-potential-and-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of Time - Dental Hand-held
export const addLinearityOfTimeForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/linearity-of-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfTimeByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/linearity-of-time-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateLinearityOfTimeForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/linearity-of-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mA Loading - Dental Hand-held
export const addLinearityOfMaLoadingForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/linearity-of-ma-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMaLoadingByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/linearity-of-ma-loading-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateLinearityOfMaLoadingForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/linearity-of-ma-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading - Dental Hand-held
export const addLinearityOfMasLoadingForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/linearity-of-mas-loading/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/linearity-of-mas-loading-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const updateLinearityOfMasLoadingForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/linearity-of-mas-loading/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Consistency of Radiation Output - Dental Hand-held (rename from Reproducibility)
export const addConsistencyOfRadiationOutputForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/consistency-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getConsistencyOfRadiationOutputByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/consistency-of-radiation-output-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getConsistencyOfRadiationOutputByTestIdForDentalHandHeld = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-hand-held/consistency-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateConsistencyOfRadiationOutputForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/consistency-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Reproducibility of Radiation Output - Dental Hand-held
export const addReproducibilityOfRadiationOutputForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/reproducibility-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getReproducibilityOfRadiationOutputByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/reproducibility-of-radiation-output-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getReproducibilityOfRadiationOutputByTestIdForDentalHandHeld = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-hand-held/reproducibility-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateReproducibilityOfRadiationOutputForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/reproducibility-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Tube Housing Leakage - Dental Hand-held
export const addTubeHousingLeakageForDentalHandHeld = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/dental-hand-held/tube-housing-leakage/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTubeHousingLeakageByServiceIdForDentalHandHeld = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/dental-hand-held/tube-housing-leakage-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getTubeHousingLeakageByTestIdForDentalHandHeld = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/dental-hand-held/tube-housing-leakage/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTubeHousingLeakageForDentalHandHeld = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/dental-hand-held/tube-housing-leakage/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// ==================== Radiography Fixed APIs ====================

export const getReportHeaderForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/radiography-fixed/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching Radiography Fixed report:", error);
        throw error;
    }
};

// Accuracy of Irradiation Time - Radiography Fixed
export const addAccuracyOfIrradiationTimeForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/accuracy-of-irradiation-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - Radiography Fixed
export const addAccuracyOfOperatingPotentialForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/accuracy-of-operating-potential-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Total Filtration - Radiography Fixed
export const addTotalFiltrationForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/total-filtration/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTotalFiltrationByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/total-filtration-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { success: true, data: null };
        throw error;
    }
};

export const getTotalFiltrationByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/total-filtration/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTotalFiltrationForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/total-filtration/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Central Beam Alignment - Radiography Fixed
export const addCentralBeamAlignmentForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/central-beam-alignment/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCentralBeamAlignmentByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/central-beam-alignment-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCentralBeamAlignmentByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/central-beam-alignment/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCentralBeamAlignmentForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/central-beam-alignment/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Congruence - Radiography Fixed
export const addCongruenceForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/congruence/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCongruenceByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/congruence-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCongruenceByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/congruence/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCongruenceForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/congruence/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Effective Focal Spot - Radiography Fixed
export const addEffectiveFocalSpotForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/effective-focal-spot/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getEffectiveFocalSpotByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/effective-focal-spot-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getEffectiveFocalSpotByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/effective-focal-spot/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateEffectiveFocalSpotForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/effective-focal-spot/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading Stations - Radiography Fixed
export const addLinearityOfMasLoadingStationsForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/linearity-of-mas-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingStationsByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/linearity-of-mas-loading-stations-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingStationsByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/linearity-of-mas-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingStationsForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/linearity-of-mas-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Output Consistency - Radiography Fixed
export const addOutputConsistencyForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/output-consistency/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getOutputConsistencyByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/output-consistency-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getOutputConsistencyByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/output-consistency/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateOutputConsistencyForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/output-consistency/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Leakage Level - Radiography Fixed
export const addRadiationLeakageLevelForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/radiation-leakage-level-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/radiation-leakage-level/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationLeakageLevelForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Protection Survey - Radiography Fixed
export const addRadiationProtectionSurveyForRadiographyFixed = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-fixed/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForRadiographyFixed = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-fixed/radiation-protection-survey-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationProtectionSurveyByTestIdForRadiographyFixed = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-fixed/radiation-protection-survey/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationProtectionSurveyForRadiographyFixed = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-fixed/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// ==================== Radiography Mobile with HT APIs ====================

export const getReportHeaderForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/radiography-mobile-ht/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching Radiography Mobile with HT report:", error);
        throw error;
    }
};

// Accuracy of Irradiation Time - Radiography Mobile with HT
export const addAccuracyOfIrradiationTimeForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/accuracy-of-irradiation-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - Radiography Mobile with HT
export const addAccuracyOfOperatingPotentialForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/accuracy-of-operating-potential-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Central Beam Alignment - Radiography Mobile with HT
export const addCentralBeamAlignmentForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/central-beam-alignment/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCentralBeamAlignmentByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/central-beam-alignment-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCentralBeamAlignmentByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/central-beam-alignment/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCentralBeamAlignmentForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/central-beam-alignment/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Congruence - Radiography Mobile with HT
export const addCongruenceForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/congruence/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCongruenceByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/congruence-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCongruenceByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/congruence/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCongruenceForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/congruence/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Effective Focal Spot - Radiography Mobile with HT
export const addEffectiveFocalSpotForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/effective-focal-spot/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getEffectiveFocalSpotByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/effective-focal-spot-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getEffectiveFocalSpotByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/effective-focal-spot/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateEffectiveFocalSpotForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/effective-focal-spot/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading Stations - Radiography Mobile with HT
export const addLinearityOfMasLoadingStationsForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/linearity-of-mas-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingStationsByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/linearity-of-mas-loading-stations-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingStationsByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/linearity-of-mas-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingStationsForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/linearity-of-mas-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Output Consistency - Radiography Mobile with HT
export const addOutputConsistencyForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/output-consistency/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getOutputConsistencyByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/output-consistency-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getOutputConsistencyByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/output-consistency/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateOutputConsistencyForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/output-consistency/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Leakage Level - Radiography Mobile with HT
export const addRadiationLeakageLevelForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/radiation-leakage-level-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/radiation-leakage-level/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationLeakageLevelForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Protection Survey - Radiography Mobile with HT
export const addRadiationProtectionSurveyForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/radiation-protection-survey-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationProtectionSurveyByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/radiation-protection-survey/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationProtectionSurveyForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Total Filtration - Radiography Mobile HT
export const addTotalFiltrationForRadiographyMobileHT = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile-ht/total-filtration/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTotalFiltrationByServiceIdForRadiographyMobileHT = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile-ht/total-filtration-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { success: true, data: null };
        throw error;
    }
};

export const getTotalFiltrationByTestIdForRadiographyMobileHT = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile-ht/total-filtration/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTotalFiltrationForRadiographyMobileHT = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile-ht/total-filtration/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// ==================== Radiography Portable APIs ====================

export const getReportHeaderForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/radiography-portable/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching Radiography Portable report:", error);
        throw error;
    }
};

// Accuracy of Irradiation Time - Radiography Portable
export const addAccuracyOfIrradiationTimeForRadiographyPortable = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-portable/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-portable/accuracy-of-irradiation-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForRadiographyPortable = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-portable/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForRadiographyPortable = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-portable/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - Radiography Portable
export const addAccuracyOfOperatingPotentialForRadiographyPortable = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-portable/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-portable/accuracy-of-operating-potential-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForRadiographyPortable = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-portable/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForRadiographyPortable = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-portable/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Central Beam Alignment - Radiography Portable
export const addCentralBeamAlignmentForRadiographyPortable = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-portable/central-beam-alignment/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCentralBeamAlignmentByServiceIdForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-portable/central-beam-alignment-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCentralBeamAlignmentByTestIdForRadiographyPortable = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-portable/central-beam-alignment/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCentralBeamAlignmentForRadiographyPortable = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-portable/central-beam-alignment/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Congruence of Radiation - Radiography Portable
export const addCongruenceForRadiographyPortable = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-portable/congruence/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCongruenceByServiceIdForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-portable/congruence-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCongruenceByTestIdForRadiographyPortable = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-portable/congruence/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCongruenceForRadiographyPortable = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-portable/congruence/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Effective Focal Spot - Radiography Portable
export const addEffectiveFocalSpotForRadiographyPortable = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-portable/effective-focal-spot/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getEffectiveFocalSpotByServiceIdForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-portable/effective-focal-spot-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getEffectiveFocalSpotByTestIdForRadiographyPortable = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-portable/effective-focal-spot/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateEffectiveFocalSpotForRadiographyPortable = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-portable/effective-focal-spot/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading Stations - Radiography Portable
export const addLinearityOfMasLoadingStationsForRadiographyPortable = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-portable/linearity-of-mas-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingStationsByServiceIdForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-portable/linearity-of-mas-loading-stations-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingStationsByTestIdForRadiographyPortable = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-portable/linearity-of-mas-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingStationsForRadiographyPortable = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-portable/linearity-of-mas-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Consistency of Radiation Output - Radiography Portable
export const addConsistencyOfRadiationOutputForRadiographyPortable = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-portable/consistency-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getConsistencyOfRadiationOutputByServiceIdForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-portable/consistency-of-radiation-output-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getConsistencyOfRadiationOutputByTestIdForRadiographyPortable = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-portable/consistency-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateConsistencyOfRadiationOutputForRadiographyPortable = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-portable/consistency-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Leakage Level - Radiography Portable
export const addRadiationLeakageLevelForRadiographyPortable = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-portable/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForRadiographyPortable = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-portable/radiation-leakage-level-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForRadiographyPortable = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-portable/radiation-leakage-level/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationLeakageLevelForRadiographyPortable = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-portable/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// ========== RADIOGRAPHY MOBILE API FUNCTIONS ==========

export const getReportHeaderForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/radiography-mobile/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return { exists: false };
        console.error("Error fetching Radiography Mobile report:", error);
        throw error;
    }
};

// Accuracy of Irradiation Time - Radiography Mobile
export const addAccuracyOfIrradiationTimeForRadiographyMobile = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile/accuracy-of-irradiation-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfIrradiationTimeByServiceIdForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile/accuracy-of-irradiation-time-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfIrradiationTimeByTestIdForRadiographyMobile = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile/accuracy-of-irradiation-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfIrradiationTimeForRadiographyMobile = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile/accuracy-of-irradiation-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - Radiography Mobile
export const addAccuracyOfOperatingPotentialForRadiographyMobile = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile/accuracy-of-operating-potential-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForRadiographyMobile = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForRadiographyMobile = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Central Beam Alignment - Radiography Mobile
export const addCentralBeamAlignmentForRadiographyMobile = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile/central-beam-alignment/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCentralBeamAlignmentByServiceIdForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile/central-beam-alignment-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCentralBeamAlignmentByTestIdForRadiographyMobile = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile/central-beam-alignment/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCentralBeamAlignmentForRadiographyMobile = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile/central-beam-alignment/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Congruence of Radiation - Radiography Mobile
export const addCongruenceForRadiographyMobile = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile/congruence/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCongruenceByServiceIdForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile/congruence-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCongruenceByTestIdForRadiographyMobile = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile/congruence/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCongruenceForRadiographyMobile = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile/congruence/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Effective Focal Spot - Radiography Mobile
export const addEffectiveFocalSpotForRadiographyMobile = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile/effective-focal-spot/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getEffectiveFocalSpotByServiceIdForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile/effective-focal-spot-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getEffectiveFocalSpotByTestIdForRadiographyMobile = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile/effective-focal-spot/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateEffectiveFocalSpotForRadiographyMobile = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile/effective-focal-spot/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading Stations - Radiography Mobile
export const addLinearityOfMasLoadingStationsForRadiographyMobile = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile/linearity-of-mas-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingStationsByServiceIdForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile/linearity-of-mas-loading-stations-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingStationsByTestIdForRadiographyMobile = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile/linearity-of-mas-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingStationsForRadiographyMobile = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile/linearity-of-mas-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Consistency of Radiation Output - Radiography Mobile
export const addConsistencyOfRadiationOutputForRadiographyMobile = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile/consistency-of-radiation-output/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getConsistencyOfRadiationOutputByServiceIdForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile/consistency-of-radiation-output-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getConsistencyOfRadiationOutputByTestIdForRadiographyMobile = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile/consistency-of-radiation-output/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateConsistencyOfRadiationOutputForRadiographyMobile = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile/consistency-of-radiation-output/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Leakage Level - Radiography Mobile
export const addRadiationLeakageLevelForRadiographyMobile = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/radiography-mobile/radiation-leakage-level/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationLeakageLevelByServiceIdForRadiographyMobile = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/radiography-mobile/radiation-leakage-level-by-service/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationLeakageLevelByTestIdForRadiographyMobile = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/radiography-mobile/radiation-leakage-level/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationLeakageLevelForRadiographyMobile = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/radiography-mobile/radiation-leakage-level/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// ==================== Lead Apron APIs ====================

// Lead Apron Test
export const addLeadApronTest = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/lead-apron/lead-apron-test/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLeadApronTestByServiceId = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/lead-apron/lead-apron-test-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLeadApronTestByTestId = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/lead-apron/lead-apron-test/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLeadApronTest = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/lead-apron/lead-apron-test/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Get Report Header for Lead Apron
export const getReportHeaderForLeadApron = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/lead-apron/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 500) {
            // Return the error response data if it has exists: false
            if (error.response?.data?.exists === false) {
                return error.response.data;
            }
            return { exists: false };
        }
        throw error;
    }
};

// Save Report Header for Lead Apron
export const saveReportHeaderForLeadApron = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/lead-apron/report-header/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// ==================== OBI (On-Board Imaging) APIs ====================

// Alignment Test - OBI
export const addAlignmentTestForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/alignment-test/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAlignmentTestByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/alignment-test-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAlignmentTestByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/alignment-test/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAlignmentTestForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/alignment-test/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of Time - OBI
export const addLinearityOfTimeForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/linearity-of-time/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfTimeByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/linearity-of-time-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfTimeByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/linearity-of-time/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfTimeForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/linearity-of-time/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Accuracy of Operating Potential - OBI
export const addAccuracyOfOperatingPotentialForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/accuracy-of-operating-potential/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getAccuracyOfOperatingPotentialByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/accuracy-of-operating-potential-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getAccuracyOfOperatingPotentialByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/accuracy-of-operating-potential/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateAccuracyOfOperatingPotentialForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/accuracy-of-operating-potential/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Timer Test - OBI
export const addTimerTestForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/timer-test/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTimerTestByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/timer-test-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getTimerTestByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/timer-test/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTimerTestForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/timer-test/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Output Consistency - OBI
export const addOutputConsistencyForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/output-consistency/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getOutputConsistencyByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/output-consistency-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getOutputConsistencyByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/output-consistency/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateOutputConsistencyForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/output-consistency/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Central Beam Alignment - OBI
export const addCentralBeamAlignmentForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/central-beam-alignment/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCentralBeamAlignmentByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/central-beam-alignment-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCentralBeamAlignmentByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/central-beam-alignment/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCentralBeamAlignmentForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/central-beam-alignment/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Congruence of Radiation - OBI
export const addCongruenceOfRadiationForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/congruence-of-radiation/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getCongruenceOfRadiationByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/congruence-of-radiation-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getCongruenceOfRadiationByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/congruence-of-radiation/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateCongruenceOfRadiationForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/congruence-of-radiation/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Effective Focal Spot - OBI
export const addEffectiveFocalSpotForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/effective-focal-spot/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getEffectiveFocalSpotByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/effective-focal-spot-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getEffectiveFocalSpotByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/effective-focal-spot/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateEffectiveFocalSpotForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/effective-focal-spot/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Linearity of mAs Loading Stations - OBI
export const addLinearityOfMasLoadingStationsForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/linearity-of-mas-loading-stations/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLinearityOfMasLoadingStationsByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/linearity-of-mas-loading-stations-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLinearityOfMasLoadingStationsByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/linearity-of-mas-loading-stations/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateLinearityOfMasLoadingStationsForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/linearity-of-mas-loading-stations/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Tube Housing Leakage - OBI
export const addTubeHousingLeakageForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/tube-housing-leakage/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getTubeHousingLeakageByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/tube-housing-leakage-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getTubeHousingLeakageByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/tube-housing-leakage/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateTubeHousingLeakageForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/tube-housing-leakage/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Radiation Protection Survey - OBI
export const addRadiationProtectionSurveyForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/radiation-protection-survey/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getRadiationProtectionSurveyByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/radiation-protection-survey-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getRadiationProtectionSurveyByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/radiation-protection-survey/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const updateRadiationProtectionSurveyForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/radiation-protection-survey/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// High Contrast Sensitivity - OBI
export const addHighContrastSensitivityForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/high-contrast-sensitivity/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getHighContrastSensitivityByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/high-contrast-sensitivity-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data?.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getHighContrastSensitivityByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/high-contrast-sensitivity/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.data || null;
};

export const updateHighContrastSensitivityForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/high-contrast-sensitivity/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Low Contrast Sensitivity - OBI
export const addLowContrastSensitivityForOBI = async (serviceId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.post(
        `/service-report/obi/low-contrast-sensitivity/${serviceId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

export const getLowContrastSensitivityByServiceIdForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(
            `/service-report/obi/low-contrast-sensitivity-by-serviceId/${serviceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data?.data || null;
    } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
    }
};

export const getLowContrastSensitivityByTestIdForOBI = async (testId: string) => {
    const token = Cookies.get("accessToken");
    const res = await api.get(
        `/service-report/obi/low-contrast-sensitivity/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data?.data || null;
};

export const updateLowContrastSensitivityForOBI = async (testId: string, payload: any) => {
    const token = Cookies.get("accessToken");
    const res = await api.put(
        `/service-report/obi/low-contrast-sensitivity/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
};

// Get Report Header for OBI
export const getReportHeaderForOBI = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/obi/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 500) {
            // Return the error response data if it has exists: false
            if (error.response?.data?.exists === false) {
                return error.response.data;
            }
            return { exists: false };
        }
        throw error;
    }
};

// Get Report Header for Mammography
export const getReportHeaderForMammography = async (serviceId: string) => {
    const token = Cookies.get("accessToken");
    try {
        const res = await api.get(`/service-report/mammography/report-header/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 500) {
            // Return the error response data if it has exists: false
            if (error.response?.data?.exists === false) {
                return error.response.data;
            }
            return { exists: false };
        }
        throw error;
    }
};

// ----------------------------------------------------------------------
// Interventional Radiology API Functions
// ----------------------------------------------------------------------
export const addConsistencyOfRadiationOutputForInventionalRadiology = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.post(`/service-report/inventional-radiology/consistency-of-radiation-output/${serviceId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getConsistencyOfRadiationOutputByServiceIdForInventionalRadiology = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    const params: any = {};
    if (tubeId !== undefined) {
        params.tubeId = tubeId === null ? 'null' : tubeId;
    }
    const res = await api.get(`/service-report/inventional-radiology/consistency-of-radiation-output-by-service/${serviceId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
export const updateConsistencyOfRadiationOutputForInventionalRadiology = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(`/service-report/inventional-radiology/consistency-of-radiation-output/${testId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getConsistencyOfRadiationOutputByTestIdForInventionalRadiology = async (testId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/inventional-radiology/consistency-of-radiation-output/${testId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

export const addCentralBeamAlignmentForInventionalRadiology = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    console.log("serviceId", serviceId);
    console.log("payload", payload);
    const res = await api.post(`/service-report/inventional-radiology/central-beam-alignment/${serviceId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getCentralBeamAlignmentByServiceIdForInventionalRadiology = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    const params: any = {};
    if (tubeId !== undefined) {
        params.tubeId = tubeId === null ? 'null' : tubeId;
    }
    const res = await api.get(`/service-report/inventional-radiology/central-beam-alignment-by-service/${serviceId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
export const updateCentralBeamAlignmentForInventionalRadiology = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(`/service-report/inventional-radiology/central-beam-alignment/${testId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getCentralBeamAlignmentByTestIdForInventionalRadiology = async (testId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/inventional-radiology/central-beam-alignment/${testId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

export const addEffectiveFocalSpotForInventionalRadiology = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.post(`/service-report/inventional-radiology/effective-focal-spot/${serviceId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getEffectiveFocalSpotByServiceIdForInventionalRadiology = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    const params: any = {};
    if (tubeId !== undefined) {
        params.tubeId = tubeId === null ? 'null' : tubeId;
    }
    const res = await api.get(`/service-report/inventional-radiology/effective-focal-spot-by-service/${serviceId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
export const updateEffectiveFocalSpotForInventionalRadiology = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(`/service-report/inventional-radiology/effective-focal-spot/${testId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getEffectiveFocalSpotByTestIdForInventionalRadiology = async (testId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/inventional-radiology/effective-focal-spot/${testId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

export const addLinearityOfmAsLoadingForInventionalRadiology = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.post(`/service-report/inventional-radiology/linearity-of-mas-loading/${serviceId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getLinearityOfmAsLoadingByServiceIdForInventionalRadiology = async (serviceId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/inventional-radiology/linearity-of-mas-loading-by-service/${serviceId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const updateLinearityOfmAsLoadingForInventionalRadiology = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(`/service-report/inventional-radiology/linearity-of-mas-loading/${testId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getLinearityOfmAsLoadingByTestIdForInventionalRadiology = async (testId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/inventional-radiology/linearity-of-mas-loading/${testId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

export const addRadiationProtectionSurveyForInventionalRadiology = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.post(`/service-report/inventional-radiology/radiation-protection-survey/${serviceId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getRadiationProtectionSurveyByServiceIdForInventionalRadiology = async (serviceId: string) => {
    const token = Cookies.get('accessToken');
    const res = await api.get(`/service-report/inventional-radiology/radiation-protection-survey-by-service/${serviceId}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

export const addLowContrastResolutionForInventionalRadiology = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.post(`/service-report/inventional-radiology/low-contrast-resolution/${serviceId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getLowContrastResolutionByServiceIdForInventionalRadiology = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    const params: any = {};
    if (tubeId !== undefined) {
        params.tubeId = tubeId === null ? 'null' : tubeId;
    }
    const res = await api.get(`/service-report/inventional-radiology/low-contrast-resolution/${serviceId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
export const updateLowContrastResolutionForInventionalRadiology = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(`/service-report/inventional-radiology/low-contrast-resolution/${testId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

export const addHighContrastResolutionForInventionalRadiology = async (serviceId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.post(`/service-report/inventional-radiology/high-contrast-resolution/${serviceId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};
export const getHighContrastResolutionByServiceIdForInventionalRadiology = async (serviceId: string, tubeId?: string | null) => {
    const token = Cookies.get('accessToken');
    const params: any = {};
    if (tubeId !== undefined) {
        params.tubeId = tubeId === null ? 'null' : tubeId;
    }
    const res = await api.get(`/service-report/inventional-radiology/high-contrast-resolution/${serviceId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
export const updateHighContrastResolutionForInventionalRadiology = async (testId: string, payload: any) => {
    const token = Cookies.get('accessToken');
    const res = await api.put(`/service-report/inventional-radiology/high-contrast-resolution/${testId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};