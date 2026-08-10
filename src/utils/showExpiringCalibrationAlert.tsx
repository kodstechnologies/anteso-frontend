import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { getExpiringTools } from '../api';

const MySwal = withReactContent(Swal);

let activeSessionId: string | null = null;
let expiringToolsAlertPromise: Promise<void> | null = null;

const getAlertSessionId = () => {
    const token = Cookies.get('accessToken');
    if (!token) return null;

    try {
        const decoded: any = jwtDecode(token);
        return `${decoded.role}:${decoded.id}`;
    } catch {
        return null;
    }
};

type ShowExpiringCalibrationAlertOptions = {
    onAcknowledge?: () => void;
};

export const resetExpiringCalibrationAlert = () => {
    activeSessionId = null;
    expiringToolsAlertPromise = null;
};

export const showExpiringCalibrationAlert = (
    options: ShowExpiringCalibrationAlertOptions = {},
): Promise<void> => {
    const sessionId = getAlertSessionId();
    if (!sessionId) {
        return Promise.resolve();
    }

    if (activeSessionId === sessionId && expiringToolsAlertPromise) {
        return expiringToolsAlertPromise;
    }

    activeSessionId = sessionId;
    expiringToolsAlertPromise = (async () => {
        try {
            const res = await getExpiringTools();
            if (!res.success || res.count <= 0) {
                return;
            }

            const result = await MySwal.fire({
                title: (
                    <div className="text-xl font-bold text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-6 w-6" />
                        Expiring Calibration Alerts
                    </div>
                ),
                html: (
                    <div className="mt-4 text-left">
                        <p className="text-gray-600 mb-4">The following tools are expiring within the next 7 days:</p>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Tool Name</th>
                                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Serial No.</th>
                                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Valid Till</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {res.data.map((tool: any) => (
                                        <tr key={tool._id}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{tool.nomenclature}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600">{tool.SrNo}</td>
                                            <td className="px-4 py-2 text-sm font-medium text-red-500">
                                                {new Date(tool.calibrationValidTill).toLocaleDateString('en-GB')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ),
                icon: 'warning',
                confirmButtonText: 'Acknowledged',
                confirmButtonColor: '#EF4444',
                width: '600px',
                padding: '2rem',
                customClass: {
                    popup: 'rounded-2xl',
                    confirmButton: 'rounded-lg px-6 py-2.5 font-semibold transition-all hover:scale-105 active:scale-95',
                },
            });

            if (result.isConfirmed && options.onAcknowledge) {
                options.onAcknowledge();
            }
        } catch (error) {
            console.error('Error checking expiring tools:', error);
            activeSessionId = null;
            expiringToolsAlertPromise = null;
        }
    })();

    return expiringToolsAlertPromise;
};
