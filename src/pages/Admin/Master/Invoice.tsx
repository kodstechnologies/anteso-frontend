import React from 'react'
import Breadcrumb, { BreadcrumbItem } from '../../../components/common/Breadcrumb'
import { Link } from 'react-router-dom'
import IconPlus from '../../../components/Icon/IconPlus'
import IconHome from '../../../components/Icon/IconHome';
import IconBox from '../../../components/Icon/IconBox';
const breadcrumbItems: BreadcrumbItem[] = [
  { label: 'Dashboard', to: '/', icon: <IconHome /> },
  { label: 'Invoice', icon: <IconBox /> },
];

const Invoice = () => {
  return (
    <div>
      < Breadcrumb items={breadcrumbItems} />
      <div className="panel px-0 border-white-light dark:border-[#1b2e4b]">
        <div className="invoice-table">
          <div className="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
            <div className="flex items-center gap-2">
              <Link to="/admin/invoice/add" className="btn btn-primary gap-2">
                <IconPlus />
                Add Invoice
              </Link>
            </div>
            <div className="ltr:ml-auto rtl:mr-auto">
              {/* <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Invoice