import { motion } from "framer-motion"
import FormattedDate from "../../components/common/FormattedDate"

interface HospitalDetails {
    enquiryId: string
    hospitalName: string
    customer: {
        _id: string
        name: string
        phone: string | number
        email: string
    }
    services: {
        _id: string
        machineType: string
        equipmentNo: string | number
        machineModel: string
        serialNumber?: string
        remark?: string
        workTypeDetails: { workType: string; status: string }[]
    }[]
    additionalServices: Record<string, string>
    specialInstructions?: string
    attachment?: string
    enquiryStatusDates: {
        enquiredOn?: string
        quotationSentOn?: string
        approvedOn?: string
    }
}

const Timeline = ({ details }: { details: HospitalDetails }) => {
    const timelineItems = [
        {
            label: "Enquired on",
            color: "primary",
            date: details.enquiryStatusDates.enquiredOn,
        },
        {
            label: "Quotation sent",
            color: "secondary",
            date: details.enquiryStatusDates.quotationSentOn,
        },
        {
            label: "Approved",
            color: "success",
            date: details.enquiryStatusDates.approvedOn,
        },
    ]

    return (
        <div className="mx-auto md:ml-auto md:mr-0">
            {timelineItems.map((item, idx) => (
                <motion.div
                    key={idx}
                    className="flex"
                    initial={{ opacity: 0, y: -30 }}   // start above
                    animate={{ opacity: 1, y: 0 }}     // move down
                    transition={{ delay: idx * 0.2, duration: 0.5 }}
                >
                    {/* Timeline dot & line */}
                    <div
                        className={`relative before:absolute before:left-1/2 before:-translate-x-1/2 before:top-[15px] 
                        before:w-2.5 before:h-2.5 before:border-2 before:border-${item.color} before:rounded-full
                        after:absolute after:left-1/2 after:-translate-x-1/2 after:top-[25px] after:-bottom-[15px] 
                        after:w-0 after:h-auto after:border-l-2 after:border-${item.color} after:rounded-full`}
                    ></div>

                    {/* Text */}
                    <div className="p-2.5 self-center ltr:ml-2.5 rtl:ltr:mr-2.5 rtl:ml-2.5">
                        <p className="text-[#3b3f5c] dark:text-white-light font-semibold text-[13px]">
                            {item.label}
                        </p>
                        <p className="text-white-dark text-xs font-bold self-center min-w-[100px]">
                            <FormattedDate dateString={item.date} />
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}

export default Timeline