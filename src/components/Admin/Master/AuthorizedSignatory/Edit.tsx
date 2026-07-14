import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAuthorizedSignatoryById, updateAuthorizedSignatory } from '../../../../api/index';

const EditAuthorizedSignatory = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [existingSignature, setExistingSignature] = useState('');
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const res = await getAuthorizedSignatoryById(id);
                const data = res?.data;
                setName(data?.name || '');
                setExistingSignature(data?.signature || '');
            } catch (error: any) {
                toast.error(error.message || 'Failed to load authorized signatory');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSignatureFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(file ? URL.createObjectURL(file) : '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }

        setSaving(true);
        try {
            if (signatureFile) {
                const formData = new FormData();
                formData.append('name', name.trim());
                formData.append('signature', signatureFile);
                await updateAuthorizedSignatory(id, formData);
            } else {
                await updateAuthorizedSignatory(id, { name: name.trim() });
            }
            toast.success('Authorized signatory updated successfully');
            navigate('/admin/authorized-signatory');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
                <li>
                    <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
                        Dashboard
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <Link to="/admin/authorized-signatory" className="text-primary">
                        Authorized Signatory
                    </Link>
                </li>
                <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
                    <span>Edit</span>
                </li>
            </ol>

            <div className="panel">
                <h2 className="text-xl font-semibold mb-4">Edit Authorized Signatory</h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                    <div>
                        <label htmlFor="name" className="block mb-1 font-medium">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input w-full"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="signature" className="block mb-1 font-medium">
                            Signature Image {existingSignature ? '(optional — upload to replace)' : ''}
                        </label>
                        <input
                            type="file"
                            id="signature"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="form-input w-full"
                        />
                        <div className="mt-3">
                            <p className="text-sm text-gray-500 mb-1">
                                {previewUrl ? 'New preview' : 'Current signature'}
                            </p>
                            {(previewUrl || existingSignature) && (
                                <img
                                    src={previewUrl || existingSignature}
                                    alt="Signature"
                                    className="h-24 max-w-full object-contain rounded border border-gray-200 bg-white p-2"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/admin/authorized-signatory')}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Updating...' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default EditAuthorizedSignatory;
