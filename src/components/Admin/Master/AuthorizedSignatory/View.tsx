import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaUserCheck } from 'react-icons/fa';
import { getAuthorizedSignatoryById } from '../../../../api/index';

interface Signatory {
    name: string;
    signature: string;
    createdAt?: string;
    updatedAt?: string;
}

const ViewAuthorizedSignatory = () => {
    const { id } = useParams<{ id: string }>();
    const [signatory, setSignatory] = useState<Signatory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!id) return;
                const res = await getAuthorizedSignatoryById(id);
                setSignatory(res?.data || null);
            } catch (err: any) {
                setError(err.message || 'Failed to load');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

    return (
        <div className="p-6">
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark pb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/authorized-signatory" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Authorized Signatory
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <span className="text-gray-700 dark:text-white">View</span>
                </li>
            </ol>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaUserCheck className="text-primary" /> Authorized Signatory Details
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Name</div>
                        <div className="text-gray-800 font-medium">{signatory?.name || '—'}</div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm sm:col-span-2">
                        <div className="text-xs uppercase text-gray-500 font-semibold mb-2">Signature</div>
                        {signatory?.signature ? (
                            <img
                                src={signatory.signature}
                                alt={signatory.name}
                                className="h-28 max-w-full object-contain rounded border border-gray-200 bg-white p-2"
                            />
                        ) : (
                            <div className="text-gray-800 font-medium">—</div>
                        )}
                    </div>

                    {signatory?.createdAt && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Created At</div>
                            <div className="text-gray-800 font-medium">
                                {new Date(signatory.createdAt).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <Link to="/admin/authorized-signatory" className="btn btn-outline-primary">
                        Back to List
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ViewAuthorizedSignatory;
