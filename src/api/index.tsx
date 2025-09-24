import axios from 'axios'
import Cookies from 'js-cookie';

const VITE_BACKEND_LOCALHOST_API_URL = import.meta.env.VITE_BACKEND_API_URL;

const api = axios.create({
    baseURL: VITE_BACKEND_LOCALHOST_API_URL,
});

export const adminLogin = async (payload: any) => {
    try {
        const res = await api.post('/auth/login', payload)
        return res;
    } catch (error) {
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
export const createRsoByClientId = async (clientId: string, payload: any) => {
    try {
        const token = Cookies.get('accessToken');

        console.log("📦 Payload being sent:", payload);

        const res = await api.post(`/rso/create-rso-by-client/${clientId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json', // ← Important
            },
        });

        return res.data;
    } catch (error: any) {
        console.error("❌ Error in createRsoByClientId:", error?.response?.data || error.message);
        throw error;
    }
};

export const createInstituteByClientId = async (clientId: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.post(`/institute/create-institute-by-client/${clientId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~ createinstituteByClientId ~ error:", error?.response?.data || error.message);
        throw error;
    }
}


//get all hospitals,rsos and institute
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
export const getAllRsosByClientId = async (clientId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/rso/get-allRso-by-client/${clientId}`, {
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
export const getAllIstitutessByClientId = async (clientId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/institute/get-institutes-by-client/${clientId}`, {
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
export const getInstituteByClientIdAndInstituteId = async (clientId: any, instituteId: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/institute/get-institute-by-client-and-institute/${clientId}/${instituteId}`, {
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
export const getRsoByClientIdAndRsoId = async (clientId: any, rsoId: any) => {
    console.log("🚀 ~ getRsoByClientIdAndRsoId ~ rsoId:", rsoId)
    console.log("🚀 ~ getRsoByClientIdAndRsoId ~ clientId:", clientId)
    try {
        const token = Cookies.get('accessToken');
        const res = await api.get(`/rso/get-rso-by-clienId-and-rsoId/${clientId}/${rsoId}`, {
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
export const editInstituteByByClientIDandInstituteId = async (clientId: any, InstituteId: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/institute/update-institute-by-client-and-institute/${clientId}/${InstituteId}`, payload, {
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
export const editRsoByClientIDandRsoId = async (clientId: any, rsoId: any, payload: any) => {
    console.log("🚀 ~ editRsoByClientIDandRsoId ~ rsoId:", rsoId)
    console.log("🚀 ~ editRsoByClientIDandRsoId ~ clientId:", clientId)
    try {
        const token = Cookies.get('accessToken');
        const res = await api.put(`/rso/update-rso-by-client/${clientId}/${rsoId}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        // console.log("🚀 ~ createRsoByClientId ~ error:", error)
        console.error("🚀 ~update rso ~ error:", error?.response?.data || error.message);
        throw error;
    }
}

//delete hospital,rso and institute
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
export const deleteInstituteByClientIdAndInstituteId = async (clientId: any, InstituteId: any,) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.delete(`/institute/delete-institute-by-client-and-institute/${clientId}/${InstituteId}`, {
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
export const deleteRsoByClientIdAndRsoId = async (clientId: any, rsoId: any,) => {
    try {
        const token = Cookies.get('accessToken');
        const res = await api.delete(`/rso/delete-rso-by-id/${clientId}/${rsoId}`, {
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



export const addEnquiry = async (payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.post('/enquiry/add', payload, {
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
//used in add quotation
export const getEnquiryById = async (enquiryId: any) => {
    console.log("🚀 ~ getEnquiryById ~ enquiryId:", enquiryId)
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
        console.log("🚀 ~ getAllEnquiry ~ token:", token)
        const res = await api.get('/enquiry/get-all', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getAllEnquiry ~ res:", res)
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ getClientById ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}
//used in quotation
export const allEmployees = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get('/technician/get-all', {
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

//employee CRUD
export const addEmployee = async (payload: any) => {
    console.log("🚀 ~ addEmployee ~ payload:", payload)
    try {
        const token = Cookies.get('accessToken')
        const res = await api.post('/technician/add', payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ add employee ~ error:", error);

        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const editEmployee = async (id: any, payload: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.put(`/technician/update-by-id/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ edit employee ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch client data"
        );
    }
}

export const getAllEmployees = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/get-all`, {
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

export const getEmployeeById = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/get-by-id/${id}`, {
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
        console.log("🚀 ~ getAllLeave ~ res:", res.data.data.data)
        return res.data.data.data
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

export const editCourierById = async (id: any, payload: any) => {
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
        console.log("🚀 ~ getAllTools ~ res:", res.data)
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
        console.log("🚀 ~ getToolById ~ res.data:", res)
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

//orders
export const getAllOrders = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/get-all`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        console.log("🚀 ~ getAllorders ~ res:", res.data)
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
        console.log("🚀 ~ basic details ~ res:", res.data)
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
        console.log("🚀 ~ basic details ~ res--------->from index :", res.data)
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
        const res = await api.get('/technician/get-all', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ all  technicians ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch technician data"
        );
    }
}

export const getMachineDetails = async (id: any) => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/orders/machine-details/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
    } catch (error: any) {
        console.error("🚀 ~ all  machines ~ error:", error);
        throw new Error(
            error?.response?.data?.message || "Failed to fetch machines data"
        );
    }
}

export const getAllOfficeStaff = async () => {
    try {
        const token = Cookies.get('accessToken')
        const res = await api.get(`/technician/all-officeStaff`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return res.data
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
export const completedOrderStatus = async () => {
    try {
        const token = Cookies.get('accessToken')

    } catch (error) {

    }
}
// export const 
//dummy