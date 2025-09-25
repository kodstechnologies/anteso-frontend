// src/components/common/FormattedDate.tsx
import React from "react"

interface FormattedDateProps {
    dateString?: string
    showTime?: boolean 
}

const FormattedDate: React.FC<FormattedDateProps> = ({ dateString, showTime = true }) => {
    if (!dateString) return <span>---</span>

    const date = new Date(dateString)

    const options: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(showTime && { hour: "2-digit", minute: "2-digit" }), // add time only if needed
    }

    return <span>{date.toLocaleString("en-IN", options)}</span>
}

export default FormattedDate
