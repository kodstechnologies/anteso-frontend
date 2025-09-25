import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaUserTie,
  FaMapMarkerAlt,
  FaCity,
  FaFlag,
  FaHashtag,
  FaMap,
  FaRegCalendarCheck,
  FaVials,
  FaRupeeSign,
  FaCogs,
} from 'react-icons/fa';

interface QATest {
  label: string;
  value: string;
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
  travel: number;
  actual: number;
  fixed: number;
}

const serviceLabelMap: Record<string, string> = {
  INSTITUTE_REGISTRATION: 'Institute Registration',
  PROCUREMENT: 'Procurement',
  LICENSE: 'License',
};

const View: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [dealer, setDealer] = useState<DealerType | null>(null);

  useEffect(() => {
    // Dummy data – replace this with API later
    const dummyDealer: DealerType = {
      dealersName: 'Radiant Diagnostics',
      address: '123, Main Street, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      region: 'West',
      mouValidity: '2025-12-31',
      qaTests: [
        { label: 'FIXED X RAY', value: 'FIXED_X_RAY', price: 3500 },
        { label: 'C ARM', value: 'C_ARM', price: 3000 },
      ],
      services: ['INSTITUTE_REGISTRATION', 'LICENSE'],
      travel: 1000,
      actual: 2000,
      fixed: 1500,
    };

    setDealer(dummyDealer);

    // Future API call:
    /*
    axios.get(`/api/dealers/${id}`)
      .then(res => setDealer(res.data))
      .catch(err => console.error(err));
    */
  }, [id]);

  if (!dealer) return <div className="p-6 text-gray-600">Loading...</div>;

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
          <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            View Dealer
          </Link>
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
          <Detail label="MOU Validity" value={dealer.mouValidity} icon={<FaRegCalendarCheck />} />
        </div>

        {/* QA Tests */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaVials className="text-primary" /> QA Tests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            {dealer.qaTests.map((test) => (
              <Detail key={test.value} label={test.label} value={`₹ ${test.price}`} icon={<FaVials />} />
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FaCogs className="text-primary" /> Services
          </h2>
          <ul className="list-disc list-inside text-gray-600">
            {dealer.services.map((service) => (
              <li key={service}>{serviceLabelMap[service] || service}</li>
            ))}
          </ul>
        </div>

        {/* Costs */}
        {/* <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <Detail label="Travel Cost" value={`₹ ${dealer.travel}`} icon={<FaRupeeSign />} />
          <Detail label="Actual Cost" value={`₹ ${dealer.actual}`} icon={<FaRupeeSign />} />
          <Detail label="Fixed Cost" value={`₹ ${dealer.fixed}`} icon={<FaRupeeSign />} />
        </div> */}
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
