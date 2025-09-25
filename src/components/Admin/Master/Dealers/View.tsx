import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaUserTie, FaMapMarkerAlt, FaCity, FaFlag, FaHashtag,
  FaMap, FaRegCalendarCheck, FaVials, FaCogs
} from 'react-icons/fa';
import { getDealerById } from '../../../../api'; // ✅ import api function

interface QATest {
  testName: string;
  price: number;
}

interface DealerType {
  dealersName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  region: string;
  mouValidity: string;
  qaTests: QATest[];
  services: string[];
}

const serviceLabelMap: Record<string, string> = {
  INSTITUTE_REGISTRATION: 'Institute Registration',
  PROCUREMENT: 'Procurement',
  LICENSE: 'License',
};

const View: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [dealer, setDealer] = useState<DealerType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDealer = async () => {
      try {
        const res = await getDealerById(id);
        const d = res.data.data; // actual dealer object
        setDealer({
          dealersName: d.name,         // API 'name' → UI 'dealersName'
          address: d.address,
          city: d.city,
          state: d.state,
          pinCode: d.pincode,          // API 'pincode' → UI 'pinCode'
          region: d.branch,            // API 'branch' → UI 'region'
          mouValidity: d.mouValidity,
          qaTests: d.qaTests || [],    // ensure default array
          services: d.services || [],  // optional, if backend returns it
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealer();
  }, [id]);


  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
  if (!dealer) return <div className="p-6 text-red-600">Dealer not found</div>;

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
        <li>
          <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Dashboard
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="/admin/dealer" className="text-primary">
            Dealer
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <span>View Dealer</span>
        </li>
      </ol>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaUserTie className="text-primary" /> Dealer Details
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <Detail label="Dealer Name" value={dealer.dealersName} icon={<FaUserTie />} />
          <Detail label="Address" value={dealer.address} icon={<FaMapMarkerAlt />} />
          <Detail label="City" value={dealer.city} icon={<FaCity />} />
          <Detail label="State" value={dealer.state} icon={<FaFlag />} />
          <Detail label="Pin Code" value={dealer.pinCode} icon={<FaHashtag />} />
          <Detail label="Region" value={dealer.region} icon={<FaMap />} />
          <Detail label="MOU Validity" value={new Date(dealer.mouValidity).toLocaleDateString()} icon={<FaRegCalendarCheck />} />
        </div>

        {/* QA Tests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          {dealer.qaTests.map((test, idx) => (
            <Detail
              key={idx}
              label={test.testName}
              value={`₹ ${test.price}`}
              icon={<FaVials />}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface DetailProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const Detail: React.FC<DetailProps> = ({ label, value, icon }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
    <div className="text-xs uppercase text-gray-500 font-semibold mb-1 flex items-center gap-2">
      {icon && <span className="text-primary">{icon}</span>}
      {label}
    </div>
    <div className="text-gray-800 font-medium">{value}</div>
  </div>
);

export default View;
